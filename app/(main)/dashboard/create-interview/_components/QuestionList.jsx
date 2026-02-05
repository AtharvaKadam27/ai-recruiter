"use client";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Loader, Loader2Icon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import QuestionListContainer from "./QuestionListContainer";
import { supabase } from "@/services/supabaseClient";
import { useUser } from "@/app/provider";

function QuestionList({ formData, onCreateLink }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [questionList, setQuestionList] = useState([]);

  useEffect(() => {
    if (formData) {
      GenerateQuestionList();
    }
  }, [formData]);
  const GenerateQuestionList = async () => {
    setLoading(true);
    try {
      const result = await axios.post("/api/ai-model", {
        ...formData,
      });

      let content = result.data;

      if (!content) {
        toast.error("No content received from server.");
        setLoading(false);
        return;
      }

      // If content is already an object with interviewQuestions, use it directly
      if (typeof content === "object" && content.interviewQuestions) {
        setQuestionList(content.interviewQuestions);
        setLoading(false);
        return;
      }

      // Ensure content is a string
      if (typeof content !== "string") {
        content = JSON.stringify(content);
      }

      // Try to extract JSON block using regex (handles ```json ... ```)
      const match = content.match(/```json\s*([\s\S]*?)```/i);
      let jsonString = match ? match[1].trim() : content.trim();

      // Remove any leading/trailing quotes if the whole string is wrapped
      if (jsonString.startsWith('"') && jsonString.endsWith('"')) {
        jsonString = jsonString.slice(1, -1);
      }

      // Unescape escaped characters (handles double-escaped JSON)
      jsonString = jsonString
        .replace(/\\n/g, "")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");

      let parsed;

      try {
        parsed = JSON.parse(jsonString);
      } catch (jsonError) {
        // Try one more time - sometimes the content itself is valid JSON
        try {
          parsed = JSON.parse(content);
        } catch (e) {
          console.error("Invalid JSON received from server:", content);
          toast.error("Invalid JSON format received.");
          setLoading(false);
          return;
        }
      }

      if (!parsed || !parsed.interviewQuestions) {
        toast.error("No interview questions found in the server response.");
        setLoading(false);
        return;
      }
      setQuestionList(parsed.interviewQuestions || []);
      setLoading(false);
    } catch (error) {
      toast.error("Server Error,Try again");
      setLoading(false);
    }
  };
  const onFinish = async () => {
    setSaveLoading(true);
    try {
      const interview_id = uuidv4();

      console.log("Creating interview with ID:", interview_id);
      console.log("Form data:", formData);
      console.log("User email:", user?.email);

      const insertData = {
        jobPosition: formData?.jobPosition || "",
        jobDescription: formData?.jobDescription || "",
        duration: formData?.duration || "",
        type: Array.isArray(formData?.type)
          ? formData.type.join(", ")
          : formData?.type || "",
        questionList: questionList,
        userEmail: user?.email || "",
        interview_id: interview_id,
      };

      console.log("Insert data:", insertData);

      const { data, error } = await supabase
        .from("Interviews")
        .insert(insertData)
        .select();

      console.log("Supabase response - data:", data, "error:", error);

      if (error) {
        console.error("Supabase error:", error);
        toast.error("Failed: " + error.message);
        setSaveLoading(false);
        return;
      }

      console.log("Interview created successfully!");
      toast.success("Interview created successfully!");
      setSaveLoading(false);
      onCreateLink(interview_id);
    } catch (error) {
      console.error("Catch error:", error);
      toast.error("Error: " + (error?.message || "Unknown error"));
      setSaveLoading(false);
    }
  };
  return (
    <div>
      {loading && (
        <div className="p-5 bg-blue-50 rounded-xl border border-primary flex gap-5 items-center">
          <Loader2Icon className="animate-spin" />
          <div>
            <h2 className="font-medium">Generating Interview Questions</h2>
            <p className="text-primary">
              Our AI is crafting personalized questions bases on your job
              positions
            </p>
          </div>
        </div>
      )}
      {!loading && questionList?.length > 0 && (
        <div>
          <QuestionListContainer questionList={questionList} />
        </div>
      )}
      <div className="flex justify-end mt-10">
        <Button onClick={() => onFinish()} disabled={saveLoading}>
          {saveLoading && <Loader className="animate-spin" />}Created Interview
          Link & Finish
        </Button>
      </div>
    </div>
  );
}

export default QuestionList;
