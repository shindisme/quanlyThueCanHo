import { useState, useRef, useEffect } from "react";
import { Send, Bot, X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../../lib/api";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  time: string;
}

interface ParsedContent {
  cleanText: string;
  images: { alt: string; url: string }[];
  links: { label: string; url: string }[];
}

function parseBotMessage(text: string): ParsedContent {
  const images: { alt: string; url: string }[] = [];
  const links: { label: string; url: string }[] = [];
  let cleanText = text;

  const imgRegexGlobal = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let imgMatch;
  while ((imgMatch = imgRegexGlobal.exec(text)) !== null) {
    images.push({ alt: imgMatch[1], url: imgMatch[2] });
  }
  cleanText = cleanText.replace(imgRegexGlobal, "");

  const linkRegexGlobal = /\[([^\]]+)\]\(([^)]+)\)/g;
  let linkMatch;
  while ((linkMatch = linkRegexGlobal.exec(text)) !== null) {
    links.push({ label: linkMatch[1], url: linkMatch[2] });
  }
  cleanText = cleanText.replace(linkRegexGlobal, "");

  cleanText = cleanText.trim();

  return { cleanText, images, links };
}

const suggestedQuestions = [
  "Có phòng trống nào tầm giá dưới 10 triệu không?",
  "Tôi muốn đặt lịch hẹn xem phòng",
  "Có những tòa nhà ở khu vực nào?",
  "Phòng 2 phòng ngủ có giá thuê bao nhiêu?"
];

export default function GuestChatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Xin chào! Tôi là trợ lý ảo YuKi House. Tôi có thể hỗ trợ bạn tìm kiếm căn hộ trống và giải đáp thông tin về các tòa nhà của chúng tôi. Hãy hỏi tôi bất cứ điều gì nhé!",
      sender: "bot",
      time: "Vừa xong",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(textToSend: string) {
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: textToSend,
      sender: "user",
      time: "Vừa xong",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await api.post<{ reply: string }>("/chat", { message: textToSend });
      const responseText = res.data?.reply || "Tôi chưa có câu trả lời cho vấn đề này.";

      const botMessage: Message = {
        id: messages.length + 2,
        text: responseText,
        sender: "bot",
        time: "Vừa xong",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
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
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* NÚT CHAT */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer animate-bounce-slow"
          style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }}
          title="Trợ lý ảo YuKi"
        >
          <Bot size={26} className="animate-pulse" />
        </button>
      )}

      {/* CHATBOX */}
      {isOpen && (
        <div
          className="w-90 sm:w-95 h-130 bg-white rounded-2xl border border-gray-250 shadow-2xl flex flex-col overflow-hidden animate-scale-in"
          style={{ boxShadow: "0 12px 30px rgba(0,0,0,0.15)" }}
        >
          {/* HEADER */}
          <div
            className="px-4 py-3.5 flex items-center justify-between text-white"
            style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center border border-white/25">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">Trợ lý ảo YuKi</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-success-400 rounded-full animate-pulse" />
                  <span className="text-[10px] text-purple-200">Đang hoạt động</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md hover:bg-white/10 text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* MESSAGE LIST */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                {msg.sender === "bot" && (
                  <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center shrink-0 border border-primary-200">
                    <Bot size={14} className="text-primary-600" />
                  </div>
                )}

                {/* Message bubble */}
                {msg.sender === "bot" ? (() => {
                  const parsed = parseBotMessage(msg.text);
                  const hasImage = parsed.images.length > 0;
                  const hasLink = parsed.links.length > 0;

                  if (hasImage && hasLink) {
                    return (
                      <div className="max-w-[80%]">
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                          <div className="w-full h-36 bg-gray-100 relative overflow-hidden">
                            <img src={parsed.images[0].url} alt={parsed.images[0].alt} className="w-full h-full object-cover" />
                          </div>
                          <div className="p-3">
                            <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">{parsed.cleanText || "Thông tin căn hộ"}</p>
                            <div className="mt-3 flex flex-col gap-2">
                              {parsed.links.map((link, i) => {
                                const isExternal = link.url.startsWith("http") || link.url.startsWith("https");
                                if (isExternal) {
                                  return (
                                    <a
                                      key={i}
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold text-center block transition-colors shadow-sm cursor-pointer"
                                    >
                                      {link.label}
                                    </a>
                                  );
                                }
                                return (
                                  <Link
                                    key={i}
                                    to={link.url}
                                    className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold text-center block transition-colors shadow-sm cursor-pointer"
                                  >
                                    {link.label}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 block px-1">
                          {msg.time}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div className="max-w-[75%] flex flex-col gap-1.5">
                      <div className="p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap bg-white text-gray-800 rounded-tl-none border border-gray-150 shadow-sm">
                        {parsed.cleanText || msg.text}
                      </div>
                      {hasLink && (
                        <div className="flex flex-col gap-1.5 mt-1">
                          {parsed.links.map((link, i) => {
                            const isExternal = link.url.startsWith("http") || link.url.startsWith("https");
                            if (isExternal) {
                              return (
                                <a
                                  key={i}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-1.5 px-3 bg-white hover:bg-primary-50 text-primary-600 border border-primary-200 rounded-xl text-[11px] font-semibold text-center transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  {link.label}
                                </a>
                              );
                            }
                            return (
                              <Link
                                key={i}
                                to={link.url}
                                className="py-1.5 px-3 bg-white hover:bg-primary-50 text-primary-600 border border-primary-200 rounded-xl text-[11px] font-semibold text-center transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                              >
                                {link.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                      <span className="text-[10px] text-gray-400 mt-1 block px-1">
                        {msg.time}
                      </span>
                    </div>
                  );
                })() : (
                  <div className="max-w-[75%]">
                    <div className="p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap bg-primary-600 text-white rounded-tr-none">
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block px-1">
                      {msg.time}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center shrink-0 border border-primary-200">
                  <Bot size={14} className="text-primary-600" />
                </div>
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-150 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* SUGGESTED QUESTIONS */}
          {messages.length === 1 && (
            <div className="px-4 pt-2 pb-1 bg-gray-50/50">
              <p className="text-[10px] font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles size={11} className="text-primary-500" /> Gợi ý câu hỏi:
              </p>
              <div className="flex flex-col gap-1.5 max-h-25 overflow-y-auto pr-1">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="text-left text-[11px] text-gray-700 bg-white border border-gray-200 hover:border-primary-400 hover:text-primary-600 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer font-medium leading-normal"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INPUT AREA */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 border-t border-gray-150 flex items-center gap-2 bg-white"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập nội dung thắc mắc..."
              className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-xs text-gray-800 border-none focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
