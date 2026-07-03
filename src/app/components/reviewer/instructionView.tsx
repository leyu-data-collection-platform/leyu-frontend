"use client";
import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface InstructionViewProps {
  onCancel: () => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  taskInstructions: {

    title: string;
    content: string;
    image_instruction_url: string | null;
    video_instruction_url: string | null;
    audio_instruction_url: string | null;
   
  };
}

const InstructionView: React.FC<InstructionViewProps> = ({
  onCancel,
  taskInstructions,

  open,
  setOpen,
}) => {
  console.log(taskInstructions)
  const { t } = useTranslation();
  const [showEditInstruction, setShowEditInstruction] = useState(false);
  const [showDeleteInstruction, setShowDeleteInstruction] = useState(false);
  if (!taskInstructions) {
    return (
      <div className="p-4">
        <button
          onClick={onCancel}
          className="flex items-center text-primary hover:text-blue-800 mb-4"
        >
          <span className="mr-1">←</span> {t("back")}
        </button>
        <div className="text-red-500">No instructions available.</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Back Button */}
      <button
        onClick={onCancel}
        className="flex items-center text-primary hover:text-blue-800 mb-4"
      >
        <span className="mr-1">←</span> {t("back")}
      </button>

      {/* Task Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-bold mr-2">
            {taskInstructions.title ? taskInstructions.title : ""}
          </h2>
        </div>
      </div>

      {/* Dates */}
      <div className="text-gray-500 text-sm mb-4">
     
      </div>

      {/* Instructions Section */}
      <div className="bg-gray-100 p-4 rounded-lg ">
        <h3 className="text-lg font-semibold mb-2">Instructions</h3>
        <p className="text-gray-700">{taskInstructions.content}</p>
      </div>

      {/* Video Link (if available) */}
      {taskInstructions.video_instruction_url && (
        <div className="mt-4 bg-gray-100 p-4 rounded-lg  flex items-center">
          <span className="mr-2">🔗</span>
          <div>
            <p className="font-semibold">Video Link</p>
            <a
              href={taskInstructions.video_instruction_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {taskInstructions.video_instruction_url}
            </a>
          </div>
        </div>
      )}
      {taskInstructions.audio_instruction_url && (
        <div className="mt-4 bg-gray-100 p-4 rounded-lg  flex items-center">
          <span className="mr-2">🔗</span>
          <div>
            <p className="font-semibold">Audio Link</p>
            <a
              href={taskInstructions.audio_instruction_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {taskInstructions.audio_instruction_url}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructionView;
