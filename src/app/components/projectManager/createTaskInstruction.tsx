import React, { useState } from "react";
import { X, Calendar, Users, Search } from "lucide-react";
import {
  GenerateInstruction,
  GenerateQAInstruction,
  GenerateReviewerInstruction,
} from "@/lib/hooks/useProjectManager";
import { useDebounce } from "@/lib/hooks/useDebounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialogLeft";
import { userRoleProfiles } from "@/lib/hooks/useFetchUser";

import { toast } from "sonner";

import { useSession } from "next-auth/react";
interface CreateTaskInstructionProps {
  onCancel: () => void;
  open: boolean;
  taskId: string;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface CreateTaskInstruction {
  name: string;
  description: string;
  taskId: string;
}

const CreateTaskInstruction: React.FC<CreateTaskInstructionProps> = ({
  onCancel,
  taskId,
  open,
  setOpen,
}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const debouncedTaskSearch = useDebounce(taskSearchQuery, 500);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    video_instruction_url: "",
    audio_instruction_url: "",
    taskId: taskId,
    user_type: "Contributor",
  });

  const [verificationStatus, setVerificationStatus] = useState<string>();
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const addInstructionMutation = GenerateInstruction();
  const addInstructionQAMutation = GenerateQAInstruction();
  const addInstructionReviewerMutation = GenerateReviewerInstruction();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.user_type === "Contributor") {
      try {
        addInstructionMutation.mutateAsync({
          title: formData.title,
          content: formData.content,
          video_instruction_url: formData.video_instruction_url,
          audio_instruction_url: formData.audio_instruction_url,
          taskId: taskId
        });
        onCancel();
      } catch (error) {}
    } else if (formData.user_type === "QA") {
      try {
        addInstructionQAMutation.mutateAsync({
          title: formData.title,
          content: formData.content,
          video_instruction_url: formData.video_instruction_url,
          audio_instruction_url: formData.audio_instruction_url,
          taskId: taskId
        });
        onCancel();
      } catch (error) {}
    } else if (formData.user_type === "Reviewer") {
      try {
        addInstructionReviewerMutation.mutateAsync({
          title: formData.title,
          content: formData.content,
          video_instruction_url: formData.video_instruction_url,
          audio_instruction_url: formData.audio_instruction_url,
          taskId: taskId,
        });
        onCancel();
      } catch (error) {}
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader></DialogHeader>
        <DialogTitle className="text-lg font-semibold">
          Add instruction
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                content
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audio instruction url
              </label>
              <input
                name="audio_instruction_url"
                value={formData.audio_instruction_url}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video instruction url
              </label>
              <input
                name="video_instruction_url"
                value={formData.video_instruction_url}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="px-2 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Type
              </label>
              <label className="ml-2">
                <input
                  type="radio"
                  name="user_type"
                  value="Contributor"
                  className="ml-2"
                  checked={formData.user_type === "Contributor"}
                  onChange={(e) =>
                    setFormData({ ...formData, user_type: e.target.value })
                  }
                />
                <label className=" text-sm font-medium text-gray-700 mb-1">
                 {" "}  Contributor
                </label>
              </label>

              <label className="ml-2">
                <input
                  type="radio"
                  name="user_type"
                  value="Reviewer"
                  className="ml-2"
                  checked={formData.user_type === "Reviewer"}
                  onChange={(e) =>
                    setFormData({ ...formData, user_type: e.target.value })
                  }
                />
                <label className=" text-sm font-medium text-gray-700 mb-1">
                 {" "}  Reviewer
                </label>
              </label>

              <label className="ml-2">
                <input
                  type="radio"
                  name="user_type"
                  value="QA"
                  className="ml-2"
                  checked={formData.user_type === "QA"}
                  onChange={(e) =>
                    setFormData({ ...formData, user_type: e.target.value })
                  }
                />
                <label className=" mr-2 text-sm font-medium text-gray-700 mb-1">
                  {" "}
                  QA
                </label>
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskInstruction;
