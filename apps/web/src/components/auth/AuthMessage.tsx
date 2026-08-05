type AuthMessageProps = {
  text: string;
  tone?: 'error' | 'success' | 'info';
};

export function AuthMessage({ text, tone = 'info' }: AuthMessageProps) {
  if (!text) return null;
  return <div className={`auth-message auth-message-${tone}`}>{text}</div>;
}
