import React from "react";

function ChooseClass({ subject, setClassName, setSubject }) {
  const subjectColors = {
    Math: "blue",
    English: "red",
    Science: "green",
    History: "purple",
    Geography: "yellow",
    "Computer Science": "orange",
  };

  return (
    <div className="">
      <h1 className="text-black">What class would you like help with?</h1>
      <div className="flex flex-col mt-4">
        <button
          onClick={() => setClassName(subject + " 108")}
          className={`border-4 p-4 w-30 rounded-full m-4 shadow-lg bg-${subjectColors[subject]}-500`}
        >
          {subject} 108
        </button>
        <button
          onClick={() => setClassName(subject + " 110")}
          className={`border-4 p-4 w-30 rounded-full m-4 shadow-lg bg-${subjectColors[subject]}-500`}
        >
          {subject} 110
        </button>
        <button
          onClick={() => setClassName(subject + " 211")}
          className={`border-4 p-4 w-30 rounded-full m-4 shadow-lg bg-${subjectColors[subject]}-500`}
        >
          {subject} 211
        </button>
        <button
          onClick={() => setClassName(subject + " 304")}
          className={`border-4 p-4 w-30 rounded-full m-4 shadow-lg bg-${subjectColors[subject]}-500`}
        >
          {subject} 304
        </button>
      </div>
      <button
        onClick={() => setSubject("")}
        className="border-4 p-4 w-30 rounded-full mt-6 shadow-lg bg-gray-500"
      >
        Back
      </button>
    </div>
  );
}

export default ChooseClass;
