import { SignIn, useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router";
import LoadingSpinner from "../components/LoadingSpinner";
const LoginPage = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  if (isSignedIn) {
    const from = location.state?.from?.pathname || "/home";
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignIn
          routing="path"
          path="/login"
          afterSignInUrl="/home"
          redirectUrl="/home"
          signUpUrl="/signup"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-white/90 backdrop-blur-sm shadow-2xl border-0 rounded-xl p-8",
              headerTitle: "text-2xl font-bold text-gray-900 text-center mb-2",
              headerSubtitle: "text-gray-600 text-center mb-6",
              socialButtonsBlockButton:
                "w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md mb-3",
              socialButtonsBlockButtonText: "font-medium text-sm",
              dividerLine: "bg-gray-200",
              dividerText: "text-gray-500 text-sm font-medium",
              formFieldInput:
                "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900",
              formFieldLabel: "text-sm font-semibold text-gray-700 mb-2",
              formButtonPrimary:
                "w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl",
              footerActionLink:
                "text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200",
              formFieldAction:
                "text-blue-600 hover:text-blue-700 text-sm font-medium",
              alertText: "text-red-600 text-sm",
              formFieldErrorText: "text-red-600 text-sm mt-1",
            },
          }}
        />
      </div>
    </div>
  );
};

export default LoginPage;
