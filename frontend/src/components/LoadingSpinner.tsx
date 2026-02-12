interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

const LoadingSpinner = ({ className, size = 40 }: LoadingSpinnerProps) => (
  <div
    className={`animate-spin rounded-full border-2 border-[#403D39] border-t-amber-400 ${className ?? ""}`}
    style={{ width: size, height: size }}
    role="status"
    aria-label="Loading"
  />
);

export default LoadingSpinner;
