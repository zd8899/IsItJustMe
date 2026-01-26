interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white border border-primary-200 rounded-lg p-6 ${className}`}>
      {children}
    </div>
  );
}
