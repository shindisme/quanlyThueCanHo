import { cn } from "../../../lib/utils";

// Hien thi ky tu dau cua ten khi khong co anh
interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

// Lay 2 ky tu dau cua ten (vi du: "Nguyen Van An" => "NA")
function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ src, name, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full object-cover",
          sizeStyles[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-primary-100 text-primary-700 font-medium flex items-center justify-center",
        sizeStyles[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
