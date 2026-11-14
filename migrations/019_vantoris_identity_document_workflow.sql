-- VANTORIS migration 019: first-party encrypted identity document intake, retrieval and review.
BEGIN;
ALTER TABLE vantoris_ledger.member_identity_documents ADD COLUMN original_filename text NOT NULL DEFAULT 'identity-document';

CREATE OR REPLACE FUNCTION vantoris_ledger.reject_identity_document_content_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Vantoris identity evidence is retained; use a reviewed retention workflow'; END IF;
 IF NEW.member_id IS DISTINCT FROM OLD.member_id OR NEW.document_type IS DISTINCT FROM OLD.document_type OR
    NEW.ciphertext IS DISTINCT FROM OLD.ciphertext OR NEW.nonce IS DISTINCT FROM OLD.nonce OR
    NEW.auth_tag IS DISTINCT FROM OLD.auth_tag OR NEW.encryption_key_version IS DISTINCT FROM OLD.encryption_key_version OR
    NEW.content_sha256 IS DISTINCT FROM OLD.content_sha256 OR NEW.media_type IS DISTINCT FROM OLD.media_type OR
    NEW.original_filename IS DISTINCT FROM OLD.original_filename OR NEW.uploaded_by_member_id IS DISTINCT FROM OLD.uploaded_by_member_id OR
    NEW.created_at IS DISTINCT FROM OLD.created_at THEN
   RAISE EXCEPTION 'Vantoris identity evidence content is immutable';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS identity_document_content_immutable ON vantoris_ledger.member_identity_documents;
CREATE TRIGGER identity_document_content_immutable BEFORE UPDATE OR DELETE ON vantoris_ledger.member_identity_documents
 FOR EACH ROW EXECUTE FUNCTION vantoris_ledger.reject_identity_document_content_mutation();

CREATE OR REPLACE FUNCTION vantoris_ledger.reject_identity_review_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Vantoris identity review history is append-only'; END $$;
DROP TRIGGER IF EXISTS identity_reviews_immutable ON vantoris_ledger.member_identity_reviews;
CREATE TRIGGER identity_reviews_immutable BEFORE UPDATE OR DELETE ON vantoris_ledger.member_identity_reviews
 FOR EACH ROW EXECUTE FUNCTION vantoris_ledger.reject_identity_review_mutation();

CREATE OR REPLACE FUNCTION vantoris_ledger.store_member_identity_document(
 p_session_token_hash bytea,p_document_type text,p_ciphertext bytea,p_nonce bytea,p_auth_tag bytea,
 p_key_version integer,p_content_sha256 bytea,p_media_type text,p_original_filename text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE member_id uuid; document_id uuid:=gen_random_uuid();
BEGIN
 member_id:=vantoris_ledger.resolve_member_session(p_session_token_hash);
 IF p_document_type NOT IN ('government_id','proof_of_address','selfie','business_document','other') THEN RAISE EXCEPTION 'INVALID_IDENTITY_DOCUMENT_TYPE'; END IF;
 IF p_ciphertext IS NULL OR octet_length(p_ciphertext)<1 OR octet_length(p_ciphertext)>4194304 OR
    octet_length(p_nonce)<>12 OR octet_length(p_auth_tag)<>16 OR octet_length(p_content_sha256)<>32 OR p_key_version<1 THEN
  RAISE EXCEPTION 'INVALID_IDENTITY_DOCUMENT_PAYLOAD';
 END IF;
 IF p_media_type NOT IN ('application/pdf','image/jpeg','image/png') OR p_original_filename IS NULL OR length(p_original_filename)<1 OR length(p_original_filename)>180 THEN
  RAISE EXCEPTION 'INVALID_IDENTITY_DOCUMENT_METADATA';
 END IF;
 INSERT INTO vantoris_ledger.member_identity_documents(id,member_id,document_type,ciphertext,nonce,auth_tag,
  encryption_key_version,content_sha256,media_type,original_filename,uploaded_by_member_id)
 VALUES(document_id,member_id,p_document_type,p_ciphertext,p_nonce,p_auth_tag,p_key_version,p_content_sha256,p_media_type,left(p_original_filename,180),member_id);
 INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
 VALUES('member:'||member_id::text,'identity_document_uploaded','identity_document',document_id::text,
  jsonb_build_object('document_type',p_document_type,'media_type',p_media_type,'content_sha256',encode(p_content_sha256,'hex')));
 RETURN document_id;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.read_member_identity_document(p_session_token_hash bytea,p_document_id uuid)
RETURNS TABLE(id uuid,document_type text,ciphertext bytea,nonce bytea,auth_tag bytea,encryption_key_version integer,content_sha256 bytea,media_type text,original_filename text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE member_id uuid;
BEGIN
 member_id:=vantoris_ledger.resolve_member_session(p_session_token_hash);
 RETURN QUERY SELECT d.id,d.document_type,d.ciphertext,d.nonce,d.auth_tag,d.encryption_key_version,d.content_sha256,d.media_type,d.original_filename
  FROM vantoris_ledger.member_identity_documents d WHERE d.id=p_document_id AND d.member_id=member_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'IDENTITY_DOCUMENT_NOT_FOUND' USING ERRCODE='P0002'; END IF;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.read_staff_identity_document(p_session_token_hash bytea,p_document_id uuid)
RETURNS TABLE(id uuid,member_id uuid,document_type text,ciphertext bytea,nonce bytea,auth_tag bytea,encryption_key_version integer,content_sha256 bytea,media_type text,original_filename text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE staff_id uuid;
BEGIN
 staff_id:=vantoris_ledger.resolve_staff_session(p_session_token_hash);
 IF NOT vantoris_ledger.staff_has_capability(staff_id,'identity.review') THEN RAISE EXCEPTION 'STAFF_CAPABILITY_REQUIRED' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT d.id,d.member_id,d.document_type,d.ciphertext,d.nonce,d.auth_tag,d.encryption_key_version,d.content_sha256,d.media_type,d.original_filename
  FROM vantoris_ledger.member_identity_documents d WHERE d.id=p_document_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'IDENTITY_DOCUMENT_NOT_FOUND' USING ERRCODE='P0002'; END IF;
 INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
 VALUES('staff:'||staff_id::text,'identity_document_viewed','identity_document',p_document_id::text,'{}'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.review_member_identity_document(
 p_session_token_hash bytea,p_document_id uuid,p_decision text,p_rationale text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE staff_id uuid; member_id uuid; review_id uuid:=gen_random_uuid();
BEGIN
 staff_id:=vantoris_ledger.resolve_staff_session(p_session_token_hash);
 IF NOT vantoris_ledger.staff_has_capability(staff_id,'identity.review') THEN RAISE EXCEPTION 'STAFF_CAPABILITY_REQUIRED' USING ERRCODE='42501'; END IF;
 IF p_decision NOT IN ('approved','rejected','needs_information') OR nullif(btrim(p_rationale),'') IS NULL OR length(p_rationale)>1000 THEN
  RAISE EXCEPTION 'INVALID_IDENTITY_REVIEW_DECISION';
 END IF;
 SELECT d.member_id INTO member_id FROM vantoris_ledger.member_identity_documents d WHERE d.id=p_document_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'IDENTITY_DOCUMENT_NOT_FOUND' USING ERRCODE='P0002'; END IF;
 UPDATE vantoris_ledger.member_identity_documents SET review_status=p_decision,reviewed_by_staff_id=staff_id,reviewed_at=clock_timestamp() WHERE id=p_document_id;
 INSERT INTO vantoris_ledger.member_identity_reviews(id,member_id,document_id,reviewer_staff_id,decision,rationale)
 VALUES(review_id,member_id,p_document_id,staff_id,p_decision,btrim(p_rationale));
 INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
 VALUES('staff:'||staff_id::text,'identity_document_reviewed','identity_document',p_document_id::text,
  jsonb_build_object('review_id',review_id,'member_id',member_id,'decision',p_decision,'rationale',btrim(p_rationale)));
 RETURN review_id;
END $$;

GRANT SELECT ON vantoris_ledger.member_identity_documents,vantoris_ledger.member_identity_reviews TO vantoris_backend;
REVOKE ALL ON FUNCTION vantoris_ledger.store_member_identity_document(bytea,text,bytea,bytea,bytea,integer,bytea,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.read_member_identity_document(bytea,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.read_staff_identity_document(bytea,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.review_member_identity_document(bytea,uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.store_member_identity_document(bytea,text,bytea,bytea,bytea,integer,bytea,text,text) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.read_member_identity_document(bytea,uuid) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.read_staff_identity_document(bytea,uuid) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.review_member_identity_document(bytea,uuid,text,text) TO vantoris_backend;
COMMIT;
