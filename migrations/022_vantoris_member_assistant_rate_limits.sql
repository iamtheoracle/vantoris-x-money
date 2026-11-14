-- VANTORIS migration 022: member-scoped assistant request throttling.
-- Stores only counters and time buckets; prompts and responses are never persisted here.
BEGIN;

CREATE TABLE vantoris_ledger.member_assistant_usage (
  member_id uuid PRIMARY KEY REFERENCES vantoris_ledger.members(id),
  minute_bucket timestamptz NOT NULL,
  minute_count integer NOT NULL DEFAULT 0 CHECK (minute_count >= 0),
  utc_day date NOT NULL,
  day_count integer NOT NULL DEFAULT 0 CHECK (day_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

REVOKE ALL ON TABLE vantoris_ledger.member_assistant_usage FROM PUBLIC;
REVOKE ALL ON TABLE vantoris_ledger.member_assistant_usage FROM vantoris_backend;

CREATE OR REPLACE FUNCTION vantoris_ledger.consume_member_assistant_request(
  p_session_token_hash bytea,
  p_per_minute_limit integer,
  p_per_day_limit integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog,vantoris_ledger
AS $$
DECLARE
  v_member_id uuid;
  v_now timestamptz:=clock_timestamp();
  v_minute_bucket timestamptz;
  v_utc_day date;
  v_usage vantoris_ledger.member_assistant_usage%ROWTYPE;
BEGIN
  IF p_per_minute_limit<1 OR p_per_minute_limit>30 OR
     p_per_day_limit<1 OR p_per_day_limit>500 THEN
    RAISE EXCEPTION 'INVALID_ASSISTANT_RATE_LIMIT';
  END IF;

  v_member_id:=vantoris_ledger.resolve_member_session(p_session_token_hash);
  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'MEMBER_SESSION_INVALID' USING ERRCODE='42501';
  END IF;

  v_minute_bucket:=date_trunc('minute',v_now);
  v_utc_day:=(v_now AT TIME ZONE 'UTC')::date;

  INSERT INTO vantoris_ledger.member_assistant_usage(member_id,minute_bucket,minute_count,utc_day,day_count)
  VALUES(v_member_id,v_minute_bucket,0,v_utc_day,0)
  ON CONFLICT(member_id) DO NOTHING;

  SELECT * INTO v_usage
    FROM vantoris_ledger.member_assistant_usage
   WHERE member_id=v_member_id
   FOR UPDATE;

  IF v_usage.minute_bucket=v_minute_bucket AND v_usage.minute_count>=p_per_minute_limit THEN
    RETURN false;
  END IF;
  IF v_usage.utc_day=v_utc_day AND v_usage.day_count>=p_per_day_limit THEN
    RETURN false;
  END IF;

  UPDATE vantoris_ledger.member_assistant_usage
     SET minute_bucket=v_minute_bucket,
         minute_count=CASE WHEN v_usage.minute_bucket=v_minute_bucket THEN v_usage.minute_count+1 ELSE 1 END,
         utc_day=v_utc_day,
         day_count=CASE WHEN v_usage.utc_day=v_utc_day THEN v_usage.day_count+1 ELSE 1 END,
         updated_at=v_now
   WHERE member_id=v_member_id;

  RETURN true;
END
$$;

REVOKE ALL ON FUNCTION vantoris_ledger.consume_member_assistant_request(bytea,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.consume_member_assistant_request(bytea,integer,integer) TO vantoris_backend;

COMMIT;
