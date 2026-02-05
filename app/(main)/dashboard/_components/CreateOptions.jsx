import { Video } from "lucide-react";
import Link from "next/link";
import React from "react";

function CreateOptions() {
  return (
    <div>
      <Link
        href={"/dashboard/create-interview"}
        className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow max-w-md"
      >
        <Video className="p-3 text-primary bg-blue-50 rounded-lg h-12 w-12" />
        <h2 className="font-bold">Create New Interview</h2>
        <p className="text-gray-500">
          Create AI Interviews and schedule them with candidates
        </p>
      </Link>
    </div>
  );
}

export default CreateOptions;
