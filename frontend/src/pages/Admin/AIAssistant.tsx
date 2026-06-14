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

// Cau hoi goi y
const suggestedQuestions = [
  "Doanh thu thang nay la bao nhieu?",
  "Co bao nhieu can ho trong?",
  "Hop dong nao sap het han?",
  "Tong so nguoi thue hien tai?",
  "Yeu cau sua chua nao dang cho xu ly?",
];

// Tra loi gia lap cua AI
const mockResponses: Record<string, string> = {
  "doanh thu": "Doanh thu thang 6/2026 uoc tinh khoang 240.000.000 VND, tang 6.7% so voi thang truoc.",
  "can ho trong": "Hien tai co 6 can ho dang trong tren tong so 20 can ho trong he thong. Ty le lap day dat 70%.",
  "hop dong": "Co 2 hop dong sap het han trong 30 ngay toi. Ban co the xem chi tiet tai trang Hop dong.",
  "nguoi thue": "Hien tai co 10 nguoi thue dang hoat dong trong he thong.",
  "sua chua": "Co 3 yeu cau sua chua dang cho xu ly va 2 yeu cau dang duoc tien hanh.",
};

// Tro ly AI - giao dien chat
export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Xin chao! Toi la tro ly AI cua YuKi House. Toi co the giup ban tra cuu thong tin ve toa nha, can ho, hop dong, hoa don va nhieu hon nua. Hay hoi toi bat cu dieu gi!",
      sender: "bot",
      time: "Vua xong",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tu dong cuon xuong khi co tin nhan moi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: "user",
      time: "Vua xong",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Gia lap thoi gian suy nghi cua AI
    setTimeout(() => {
      // Tim cau tra loi phu hop
      const lowerInput = input.toLowerCase();
      let response = "Toi chua hieu ro cau hoi cua ban. Ban co the hoi ve doanh thu, can ho, hop dong, nguoi thue hoac yeu cau sua chua.";

      for (const [keyword, answer] of Object.entries(mockResponses)) {
        if (lowerInput.includes(keyword)) {
          response = answer;
          break;
        }
      }

      const botMessage: Message = {
        id: messages.length + 2,
        text: response,
        sender: "bot",
        time: "Vua xong",
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
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
