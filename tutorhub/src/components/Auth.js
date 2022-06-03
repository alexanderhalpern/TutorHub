import React from "react";

function Auth({ googleSignIn }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="flex flex-col items-center justify-center h-screen">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            googleSignIn();
          }}
        >
          Sign In With Google
        </button>
      </div>
    </div>
  );
}

export default Auth;
