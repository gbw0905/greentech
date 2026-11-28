-- Only the server writes transcripts. The caller must own the parent thread.
DROP POLICY IF EXISTS "Users manage own chat messages" ON public.chat_messages;
REVOKE INSERT, UPDATE, DELETE ON public.chat_messages FROM anon, authenticated;
CREATE POLICY "Members read messages in their own threads"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = thread_id AND t.user_id = auth.uid()
    )
  );

CREATE FUNCTION public.replace_chat_transcript(
  p_thread_id uuid, p_user_id uuid, p_title text, p_messages jsonb
)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  UPDATE public.chat_threads
  SET title = CASE WHEN title = 'New conversation' OR title = '' THEN p_title ELSE title END,
      updated_at = now()
  WHERE id = p_thread_id AND user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  DELETE FROM public.chat_messages WHERE thread_id = p_thread_id AND user_id = p_user_id;
  INSERT INTO public.chat_messages (thread_id, user_id, role, parts, created_at)
  SELECT p_thread_id, p_user_id, message->>'role', message->'parts',
         statement_timestamp() + ordinal * interval '1 microsecond'
  FROM jsonb_array_elements(p_messages) WITH ORDINALITY AS entry(message, ordinal);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.replace_chat_transcript(uuid, uuid, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_chat_transcript(uuid, uuid, text, jsonb) TO service_role;
