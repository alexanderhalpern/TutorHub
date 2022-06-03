import React from "react";

function StudentMakeRequest({ setRequested, addToQueue, setClassName }) {
  return (
    <div>
      <h1 className="text-black">
        Request help from a teacher that specializes in your subject area?
      </h1>
      <div className="flex justify-center w-full flex-row">
        <button
          onClick={() => {
            setRequested(true);
            addToQueue();
          }}
          className="border-4 p-4 w-30 rounded-full m-4 shadow-lg bg-gray-500"
        >
          Request Help
        </button>
        <button
          onClick={() => {
            setRequested(false);
            setClassName("");
          }}
          className="border-4 p-4 w-30 rounded-full m-4 shadow-lg bg-gray-500"
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default StudentMakeRequest;
