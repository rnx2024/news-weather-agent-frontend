// components/MessageBubble.tsx
type Props = {
  role: "user" | "assistant";
  text: string;
};

export default function MessageBubble(
  { role, text }: Readonly<Props>
) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xl rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
          isUser
            ? "text-white shadow-sm"
            : "bg-white text-slate-900 shadow-sm border border-slate-200"
        }`}
        style={isUser ? { backgroundColor: "#0066CC" } : undefined}
      >
        {text}
      </div>
    </div>
  );
}
