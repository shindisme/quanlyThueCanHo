import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";

// Tin nhan gia lap
interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  time: string;
}

import api from "../../lib/api";

// Cau hoi goi y
const suggestedQuestions = [
  "Có bao nhiêu căn hộ trống?",
  "Địa chỉ tòa nhà Quận 1 ở đâu?",
  "Giới thiệu các căn hộ ở Thủ Đức",
  "Có phòng nào trống 2 phòng ngủ không?",
];

// Tro ly AI - giao dien chat
export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Xin chào! Tôi là trợ lý AI của YuKi House. Tôi có thể giúp bạn tra cứu thông tin về tòa nhà và các căn hộ trống trong hệ thống. Hãy hỏi tôi bất cứ điều gì!",
      sender: "bot",
      time: "Vừa xong",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim()) return;

    const userText = input;
    const userMessage: Message = {
      id: messages.length + 1,
      text: userText,
      sender: "user",
      time: "Vừa xong",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Gọi real API đến backend
      const res = await api.post<{ reply: string }>("/chat", { message: userText });
      const responseText = res.data?.reply || "Tôi chưa có câu trả lời cho vấn đề này.";

      const botMessage: Message = {
        id: messages.length + 2,
        text: responseText,
        sender: "bot",
        time: "Vừa xong",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 2,
        text: "Xin lỗi, hệ thống trợ lý ảo đang bận hoặc gặp sự cố kết nối. Vui lòng thử lại sau.",
        sender: "bot",
        time: "Vừa xong",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Bot}
        title="Trợ lý AI"
        subtitle="Hỏi đáp thông minh về hệ thống"
        iconColor="linear-gradient(135deg, #8B5CF6, #EC4899)"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
        {/* Sidebar goi y */}
        <Card className="lg:col-span-1 flex flex-col">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-primary-600" />
            Goi y cau hoi
          </h3>
          <div className="space-y-2">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => setInput(q)}
                className="w-full text-left text-sm px-3 py-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-primary-50 hover:text-primary-700 transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </Card>

        {/* Khung chat */}
        <Card className="lg:col-span-3 flex flex-col p-0 overflow-hidden">
          {/* Tin nhan */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === "bot" ? "bg-primary-100" : "bg-gray-200"
                  }`}>
                  {msg.sender === "bot" ? (
                    <Bot size={16} className="text-primary-600" />
                  ) : (
                    <User size={16} className="text-gray-600" />
                  )}
                </div>
                <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm ${msg.sender === "bot"
                  ? "bg-gray-50 text-gray-700"
                  : "bg-primary-600 text-white"
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <Bot size={16} className="text-primary-600" />
                </div>
                <div className="bg-gray-50 px-4 py-3 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* O nhap tin nhan */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Nhap cau hoi cua ban..."
                className="premium-input flex-1 px-4 py-3 rounded-xl"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
