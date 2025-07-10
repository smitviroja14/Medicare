const LoadingSpinner = ({ text = "Loading...", variant = "default" }) => {
  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        variant === "gradient"
          ? "bg-gradient-to-br from-blue-50 via-white to-purple-50"
          : "bg-gray-50"
      }`}
    >
      <div className="text-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4 mx-auto"></div>
          {variant === "gradient" && (
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-purple-600 rounded-full animate-spin mx-auto opacity-60"></div>
          )}
        </div>
        <p className="text-gray-600 font-medium">{text}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
