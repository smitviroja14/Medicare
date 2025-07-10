import { SignUp, useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router";
import LoadingSpinner from "../components/LoadingSpinner";

const SignUpPage = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md">
        <SignUp
          routing="path"
          path="/signup"
          afterSignUpUrl="/home"
          redirectUrl="/home"
          signInUrl="/login"
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
                "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-gray-900",
              formFieldLabel: "text-sm font-semibold text-gray-700 mb-2",
              formButtonPrimary:
                "w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl",
              footerActionLink:
                "text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200",
              formFieldAction:
                "text-indigo-600 hover:text-indigo-700 text-sm font-medium",
              alertText: "text-red-600 text-sm",
              formFieldErrorText: "text-red-600 text-sm mt-1",
            },
          }}
        />
      </div>
    </div>
  );
};

export default SignUpPage;
