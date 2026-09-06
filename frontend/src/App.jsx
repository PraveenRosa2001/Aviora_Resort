import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import AppRouter from "./routes/AppRouter";
import MobileMenuOverlay from "./components/layout/MobileMenuOverlay";
import LoadingScreen from "./components/common/LoadingScreen";
import { restoreSession } from "./features/auth/authSlice";
import { ToastProvider } from "./components/common/Toast";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();

  // Ask the API whether the token in localStorage is still valid.
  // Without this a stored session keeps showing as signed in even after the
  // seven-day JWT has expired, and every protected call would then fail.
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  return (
    <ToastProvider>
      <LoadingScreen onComplete={() => setIsLoading(false)} />
      {!isLoading && (
        <>
          <AppRouter />
          <MobileMenuOverlay />
        </>
      )}
    </ToastProvider>
  );
}

export default App;

//Only see for toast message

// import { useState } from "react";
// import { ToastAlert } from "./components/common/Toast";

// function App() {
//   const [toast, setToast] = useState(null);

//   const showToast = () => {
//     setToast({
//       message: "This is a test notification!",
//       type: "success",
//       title: "Success",
//       duration: 4000,
//     });
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//       <button
//         onClick={showToast}
//         className="px-6 py-3 bg-black text-white rounded-xl"
//       >
//         Show Toast
//       </button>

//       <ToastAlert
//         toast={toast}
//         onClose={() => setToast(null)}
//       />
//     </div>
//   );
// }

// export default App;
