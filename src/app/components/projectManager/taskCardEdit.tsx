import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { TaskCardType } from "@/app/types/project";
import { formatDateMedium } from "@/app/types/dateUtils";
import { Basedata, BasedataTaskType } from "@/app/types/basedate";
import { DeleteTask } from "./deleteTask";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialogLeft";
import { useBasedataall, useBasedataTaskType } from "@/lib/hooks/useBasedata";
import { useUpdateBasicTAsk, useDeleteTask } from "@/lib/hooks/useProject";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface TaskCardProps {
  task: TaskCardType;
  onClick: (taskId: string) => void;
}

interface UpdateTaskForm {
  name: string;
  description: string;
  task_type_id: string;
  language_id: string;
  is_public: boolean;
  require_contributor_test: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const { t } = useTranslation();
  const { data: languageData, isLoading: isLanguageLoading } = useBasedataall({
    servicename: "language",
  });
  const { data: TaskTypeData, isLoading: isTaskTypeLoading } =
    useBasedataTaskType({
      servicename: "task-type",
    });
  const languageOptions =
    languageData?.data?.map((lang: Basedata) => ({
      id: lang.id,
      name: lang.name,
      code: lang.code,
      description: lang.description,
    })) || [];
  const taskTypeOptions =
    TaskTypeData?.data?.map((taskType: BasedataTaskType) => ({
      id: taskType.id,
      name: taskType.task_type,
    })) || [];
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState<UpdateTaskForm>({
    name: task.name,
    description: task.description,
    task_type_id: task.taskType.id || "",
    language_id: task.language_id,
    is_public: task.is_public,
    require_contributor_test: task.require_contributor_test,
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateTasktMutation = useUpdateBasicTAsk();
  const deleteTaskMutation = useDeleteTask(task.id);
  const [isOpenDeletor, setIsOpenDeletor] = useState(false);

  // Close dropdown when clicking/tapping outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateTasktMutation.mutateAsync({
        id: task.id,
        name: formData.name,
        description: formData.description,
        task_type_id: formData.task_type_id,
        language_id: formData.language_id,
        is_public: formData.is_public,
        require_contributor_test: formData.require_contributor_test,
      });
      setIsEditDialogOpen(false);
      setIsDropdownOpen(false); // Close dropdown on successful update
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTaskMutation.mutateAsync();
      setIsDeleteDialogOpen(false);
      setIsDropdownOpen(false); // Close dropdown after deletion
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        [name]: target.checked,
      }));
    } else if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: Number(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDropdownOpen((prev) => !prev);
  };

  const handleEditClick = () => {
    setIsDropdownOpen(false);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="border border-gray-100 rounded-lg p-4 bg-white transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-semibold text-gray-800 truncate">
          {task.name}
        </h3>
        <div className="flex items-center space-x-1 text-sm">
          <div className="bg-[#ECFDF3] px-2 py-1 rounded-2xl flex items-center gap-1.5">
      
            <span
              className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${
                task.is_closed ? "bg-red-500" : "bg-[#14BA6D]"
              }`}
            />

      
            <span
              className={`text-xs font-medium ${
                task.is_closed ? "text-red-600" : "text-green-700"
              }`}
            >
      

              {task.is_closed ? t("inactive") : t("active")}
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.name}</p>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-600 mb-3">
        {/* Left column - Type */}
        <div className="flex flex-col">
          <span className="text-gray-500 font-medium uppercase tracking-wide">
            {t("typeLabel")}
          </span>
          <span className="font-medium px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded inline-block mt-0.5">
            {task.taskType?.task_type || "Text to Audio"}
          </span>
        </div>

        {/* Right column - Created */}
        <div className="flex flex-col">
          <span className="text-gray-500 font-medium uppercase tracking-wide">
            {t("createdDate")}
          </span>
          <span className="font-medium mt-0.5">
            {task.created_date ? formatDateMedium(task.created_date) : "—"}
          </span>
        </div>
      </div>
      <div className="mt-3 px-3 py-3 border-t border-gray-200 w-full"></div>
      <div className="flex flex-row justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onClick(task.id)}
          className="flex text-primary border-blue-600 hover:bg-blue-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="21"
            viewBox="0 0 20 21"
            fill="none"
          >
            <path
              d="M1.66699 6.75346C1.66699 6.75346 5.39795 2.58679 10.0003 2.58679C14.6027 2.58679 18.3337 6.75346 18.3337 6.75346"
              stroke="#095FAF"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
            <path
              d="M17.9537 10.9577C18.207 11.3129 18.3337 11.4906 18.3337 11.7535C18.3337 12.0164 18.207 12.1941 17.9537 12.5493C16.8152 14.1457 13.908 17.5868 10.0003 17.5868C6.09264 17.5868 3.18541 14.1457 2.04703 12.5493C1.79367 12.1941 1.66699 12.0164 1.66699 11.7535C1.66699 11.4906 1.79367 11.3129 2.04703 10.9577C3.18541 9.36133 6.09264 5.92017 10.0003 5.92017C13.908 5.92017 16.8152 9.36133 17.9537 10.9577Z"
              stroke="#095FAF"
              strokeWidth="1.25"
            />
            <path
              d="M12.5 11.7534C12.5 10.3727 11.3807 9.25342 10 9.25342C8.61925 9.25342 7.5 10.3727 7.5 11.7534C7.5 13.1342 8.61925 14.2534 10 14.2534C11.3807 14.2534 12.5 13.1342 12.5 11.7534Z"
              stroke="#095FAF"
              strokeWidth="1.25"
            />
          </svg>{" "}
          {t("viewDetails")}
        </Button>

        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="sm"
            aria-label="More options"
            onClick={handleDropdownToggle}
            aria-expanded={isDropdownOpen}
            aria-controls="dropdown-menu"
          >
            <MoreVertical className="h-5 w-5 text-gray-500" />
          </Button>
          {isDropdownOpen && (
            <div
              id="dropdown-menu"
              className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-md shadow-lg z-50"
            >
              <div className="py-1">
                <button
                  onClick={handleEditClick}
                  className="w-full text-left justify-start px-4 py-2 text-primary hover:bg-gray-100 flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="mr-2"
                  >
                    <path
                      d="M11.7282 3.23796C12.3492 2.56515 12.6597 2.22875 12.9896 2.03252C13.7857 1.55905 14.766 1.54432 15.5754 1.99368C15.9108 2.17991 16.2308 2.50685 16.8709 3.16071C17.511 3.81458 17.8311 4.14151 18.0133 4.48419C18.4532 5.31101 18.4388 6.31241 17.9753 7.12566C17.7832 7.46271 17.4539 7.7799 16.7953 8.41425L8.95892 15.962C7.71082 17.1642 7.08675 17.7652 6.3068 18.0698C5.52685 18.3745 4.66942 18.3521 2.95455 18.3072L2.72123 18.3012C2.19917 18.2875 1.93814 18.2807 1.78641 18.1084C1.63467 17.9362 1.65538 17.6703 1.69682 17.1386L1.71932 16.8498C1.83592 15.353 1.89422 14.6047 2.18651 13.9319C2.47878 13.2592 2.98295 12.713 3.99127 11.6205L11.7282 3.23796Z"
                      stroke="#095FAF"
                      strokeWidth="1.25"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10.8333 3.33325L16.6666 9.16659"
                      stroke="#095FAF"
                      strokeWidth="1.25"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M11.6667 18.3333H18.3334"
                      stroke="#095FAF"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {t("edit")}
                </button>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsOpenDeletor(true);
                  }}
                  className="w-full text-left justify-start px-4 py-2 text-red-500 hover:bg-red-100 flex items-center"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2"
                  >
                    <path
                      d="M4.24996 8.99967H13.4166M16.2812 8.99967C16.2812 10.975 15.4965 12.8694 14.0998 14.2661C12.703 15.6629 10.8086 16.4476 8.83329 16.4476C6.85798 16.4476 4.96358 15.6629 3.56682 14.2661C2.17006 12.8694 1.38538 10.975 1.38538 8.99967C1.38538 7.02436 2.17006 5.12996 3.56682 3.7332C4.96358 2.33645 6.85798 1.55176 8.83329 1.55176C10.8086 1.55176 12.703 2.33645 14.0998 3.7332C15.4965 5.12996 16.2812 7.02436 16.2812 8.99967Z"
                      stroke="#D03710"
                      strokeWidth="1.25"
                    />
                  </svg>
                  {t("deleteProject")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-full">
            <DialogHeader>
              <DialogTitle>{t("edit")} {t("taskName")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t("taskNameLabel")} <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder={t("enterTaskName")}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t("taskType")} <span className="text-red-500">*</span>
              </label>
              <select
                name="task_type_id"
                value={formData.task_type_id}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.task_type_id ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">{t("selectTaskType")}</option>
                {taskTypeOptions.map(
                  (task_type: { id: string; name: string }) => (
                    <option key={task_type.id} value={task_type.id}>
                      {task_type.name}
                    </option>
                  ),
                )}
              </select>
              {errors.task_type_id && (
                <p className="text-red-500 text-sm">{errors.task_type_id}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                required
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter description"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
                rows={4}
              />
              {errors.description && (
                <p className="text-red-500 text-sm">{errors.description}</p>
              )}
            </div>
            {/* <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Language <span className="text-red-500">*</span>
              </label>
              <select
                name="language_id"
                required
                value={formData.language_id}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.language_id ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select language</option>
                {languageOptions.map((lang: Basedata) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
              {errors.language_id && (
                <p className="text-red-500 text-sm">{errors.language_id}</p>
              )}
            </div> */}
            {task.distribution_started ? null : (
              <>
                {" "}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 mt-7">
                    <input
                      type="checkbox"
                      name="is_public"
                      checked={formData.is_public}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Public (any contributor can join)
                    </span>
                  </label>
                </div>
                <div className="space-y-2 mb-2 mt-7">
                  <label className="flex items-center space-x-2">
                    <input
                      name="require_contributor_test"
                      type="checkbox"
                      checked={formData.require_contributor_test}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Require contributor test
                    </span>
                  </label>
                </div>
              </>
            )}

            <div className="fixed bottom-0 right-0 p-4 flex justify-end space-x-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={updateTasktMutation.isPending}
                className="bg-primary text-white"
              >
                {updateTasktMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <DeleteTask
          isOpen={isOpenDeletor}
          onClose={() => setIsOpenDeletor(false)}
          task_id={task.id ? task.id : ""}
          task_name={task.name} // Add this line
        />
        {/* Delete Confirmation Dialog */}
        {/* <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will delete the task "{task.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog> */}
      </div>
    </div>
  );
};

export default TaskCard;
