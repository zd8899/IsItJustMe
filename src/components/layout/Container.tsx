interface ContainerProps {
  children: React.ReactNode;
}

export function Container({ children }: ContainerProps) {
  return <div className="max-w-4xl mx-auto px-4">{children}</div>;
}
