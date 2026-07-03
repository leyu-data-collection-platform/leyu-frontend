"use client";

import React, { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { TaskResponseData } from "@/app/types/project";
import { Basedata, BasedataTaskType } from "@/app/types/basedate";
import axios from "axios";
import { useBasedataall, useBasedataTaskType } from "@/lib/hooks/useBasedata";
import { useUpdateBasicTAsk } from "@/lib/hooks/useProject";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOURS_PER_DAY = 24;

const CATEGORIES = [
  {
    key: "basic" as const,
    label: "Basic Information",
    description: "Task name, description, type, language, and access settings",
  },
  {
    key: "demographics" as const,
    label: "Demographics & Targeting",
    description: "Dialect, age range, and gender distribution requirements",
  },
  {
    key: "location" as const,
    label: "Location & Sectors",
    description: "Geographic location and sector-specific requirements",
  },
  {
    key: "configuration" as const,
    label: "Task Configuration",
    description:
      "Contributor limits, time limits, batch size, and character/audio constraints",
  },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type UpdateCategory = (typeof CATEGORIES)[number]["key"];

interface UpdateTaskFormProps {
  task: TaskResponseData;
  onCancel: () => void;
  selectedCategory: UpdateCategory;
}

interface DialectOption {
  id: string;
  name: string;
}

interface DialectResponse {
  message: string;
  code: number;
  data: DialectOption[];
}

interface UpdateTaskFormState {
  id: string;
  // basic fields
  name: string;
  description: string;
  task_type_id: string;
  language_id: string;
  is_public: boolean;
  require_contributor_test: boolean;
  // configuration fields
  max_contributor_per_micro_task: number;
  max_contributor_per_facilitator: number | null;
  max_dataset_per_reviewer: number | null;
  max_reviewer_per_dataset: number | null;
  max_micro_task_per_contributor: number | null;
  minimum_seconds: number | null;
  maximum_seconds: number | null;
  contributor_completion_time_limit: number | null;
  reviewer_completion_time_limit: number | null;
  minimum_characters_length: number | null;
  maximum_characters_length: number | null;
  appriximate_time_per_batch: number | null;
  reviewer_payment_per_microtask: number | null;
  contributor_payment_per_microtask: number | null;
  max_retry_per_task: number | null;
  expected_number_of_total_contributors: number;
  max_expected_no_of_contributors: number | null;
  batch: number | null;
  is_dialect_specific: boolean;
  dialects: { id: string }[];
  is_age_specific: boolean;
  age: { min: number | null; max: number | null };
  is_sector_specific: boolean;
  sectors: string[];
  is_gender_specific: boolean;
  gender: { male: number; female: number };
  is_location_specific: boolean;
  locations: string[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ExpandableDescriptionProps {
  text: string;
  maxLength?: number;
}

const ExpandableDescription = memo<ExpandableDescriptionProps>(
  ({ text, maxLength = 100 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const shouldTruncate = text.length > maxLength;

    return (
      <p className="text-xs text-gray-500">
        {shouldTruncate && !isExpanded
          ? `${text.slice(0, maxLength)}... `
          : text}
        {shouldTruncate && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="font-medium ml-1"
            style={{ color: "#095FAF" }}
          >
            {isExpanded ? "Show less" : "See more"}
          </button>
        )}
      </p>
    );
  },
);
ExpandableDescription.displayName = "ExpandableDescription";

// ─── Field helpers ────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  description?: string;
}

const Field: React.FC<FieldProps> = ({
  label,
  error,
  children,
  description,
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    {description && <ExpandableDescription text={description} />}
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const UpdateTask: React.FC<UpdateTaskFormProps> = ({
  task,
  onCancel,
  selectedCategory,
}) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // ── Initial state ──────────────────────────────────────────────────────────

  const [formData, setFormData] = useState<UpdateTaskFormState>({
    id: task.id,
    name: task.name,
    description: task.description ?? "",
    task_type_id: task.task_type_id,
    language_id: task.language_id,
    is_public: task.is_public,
    require_contributor_test: task.require_contributor_test,
    max_contributor_per_micro_task:
      task.taskRequirement.max_contributor_per_micro_task,
    max_contributor_per_facilitator:
      task.taskRequirement.max_contributor_per_facilitator,
    minimum_characters_length:
      task.taskRequirement.minimum_characters_length ?? null,
    maximum_characters_length:
      task.taskRequirement.maximum_characters_length ?? null,
    maximum_seconds: task.taskRequirement.maximum_seconds ?? null,
    minimum_seconds: task.taskRequirement.minimum_seconds ?? null,
    max_expected_no_of_contributors:
      task.max_expected_no_of_contributors ?? null,
    max_dataset_per_reviewer: task.taskRequirement.max_dataset_per_reviewer,
    max_reviewer_per_dataset:
      task.taskRequirement.max_reviewer_per_dataset ?? 1,
    appriximate_time_per_batch:
      task.taskRequirement.appriximate_time_per_batch ?? null,
    reviewer_completion_time_limit:
      task.reviewer_completion_time_limit != null
        ? task.reviewer_completion_time_limit / HOURS_PER_DAY
        : null,
    contributor_completion_time_limit:
      task.contributor_completion_time_limit != null
        ? task.contributor_completion_time_limit / HOURS_PER_DAY
        : null,
    reviewer_payment_per_microtask:
      task.payment?.reviewer_credit_per_microtask ?? null,
    contributor_payment_per_microtask:
      task.payment?.contributor_credit_per_microtask ?? null,
    max_retry_per_task: task.taskRequirement.max_retry_per_task,
    expected_number_of_total_contributors:
      task.taskRequirement.expected_number_of_total_contributors,
    max_micro_task_per_contributor:
      task.taskRequirement.max_micro_task_per_contributor ?? null,
    batch: task.taskRequirement.batch ?? null,
    is_dialect_specific: task.taskRequirement.is_dialect_specific,
    dialects: task.taskRequirement.dialects?.map((d) => ({ id: d.id })) ?? [],
    is_age_specific: task.taskRequirement.is_age_specific,
    age: task.taskRequirement.age ?? { min: null, max: null },
    is_sector_specific: task.taskRequirement.is_sector_specific,
    // sectors is an array of names from the API
    sectors: task.taskRequirement.sectors ?? [],
    is_gender_specific: task.taskRequirement.is_gender_specific,
    gender: task.taskRequirement.gender ?? { male: 0, female: 0 },
    is_location_specific: task.taskRequirement.is_location_specific,
    locations: task.taskRequirement.locations?.map((l) => l.name) ?? [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Remote data ────────────────────────────────────────────────────────────

  const { data: sectorData, isLoading: isSectorLoading } = useBasedataall({
    servicename: "sector",
  });
  const { data: languageData, isLoading: isLanguageLoading } = useBasedataall({
    servicename: "language",
  });
  const { data: TaskTypeData, isLoading: isTaskTypeLoading } =
    useBasedataTaskType({
      servicename: "task-type",
    });

  const taskTypeOptions =
    TaskTypeData?.data?.map((t: BasedataTaskType) => ({
      id: t.id,
      name: t.task_type,
    })) ?? [];

  const languageOptions =
    languageData?.data?.map((l: Basedata) => ({ id: l.id, name: l.name })) ?? [];

  const sectorOptions =
    sectorData?.data?.map((s: Basedata) => ({ id: s.id, name: s.name })) ?? [];
  const { data: dialectResponseData, isLoading: dialectsLoading } =
    useQuery<DialectResponse>({
      queryKey: ["dialect", task.language_id],
      queryFn: async () => {
        if (!session?.access_token)
          throw new Error("No authentication token available");
        const response = await axios.get<DialectResponse>(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/setting/dialect/language/${task.language_id}`,
          { headers: { Authorization: `Bearer ${session.access_token}` } },
        );
        return response.data;
      },
      enabled: !!session?.access_token && !!task.language_id,
    });

  const dialectOptions = dialectResponseData?.data ?? [];

  const selectedTaskType = taskTypeOptions.find(
    (t: { id: string; name: string }) => t.id === task.task_type_id,
  );
  const isTextAudio = selectedTaskType?.name === "text-audio";

  const isLoading = isSectorLoading || isTaskTypeLoading || dialectsLoading || isLanguageLoading;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value, type } = e.target;

      if (type === "checkbox") {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev) => ({ ...prev, [name]: checked }));
      } else if (type === "number") {
        const numValue = value === "" ? null : Number(value);
        if (numValue !== null && numValue < 0) return;
        setFormData((prev) => ({ ...prev, [name]: numValue }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }

      clearError(name);
    },
    [clearError],
  );

  const handleNestedChange = useCallback(
    (field: "age" | "gender", subField: string, value: number | null) => {
      if (value !== null && value < 0) return;
      setFormData((prev) => ({
        ...prev,
        [field]: {
          ...(prev[field] as Record<string, number | null>),
          [subField]: value,
        },
      }));
      clearError(`${field}.${subField}`);
    },
    [clearError],
  );

  const handleDialectToggle = useCallback(
    (dialectId: string) => {
      setFormData((prev) => ({
        ...prev,
        dialects: prev.dialects.some((d) => d.id === dialectId)
          ? prev.dialects.filter((d) => d.id !== dialectId)
          : [...prev.dialects, { id: dialectId }],
      }));
      clearError("dialects");
    },
    [clearError],
  );

  // FIX: was setting male:0 when "Male" was selected (values were inverted)
  const handleGenderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value, checked } = e.target;
      if (!checked) return;
      setFormData((prev) => ({
        ...prev,
        gender: {
          male: value === "Male" ? 100 : 0,
          female: value === "Female" ? 100 : 0,
        },
      }));
      clearError("gender");
    },
    [clearError],
  );

  const handleGenderPercentage = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const percentage = Number(e.target.value);
      setFormData((prev) => {
        const femaleSelected =
          prev.gender?.female === 100 ||
          (!prev.gender?.male && !prev.gender?.female);
        return {
          ...prev,
          gender: {
            female: femaleSelected ? percentage : 100 - percentage,
            male: femaleSelected ? 100 - percentage : percentage,
          },
        };
      });
      clearError("gender");
    },
    [clearError],
  );

  const handleSectorToggle = useCallback(
    (sectorName: string) => {
      setFormData((prev) => ({
        ...prev,
        sectors: prev.sectors.includes(sectorName)
          ? prev.sectors.filter((s) => s !== sectorName)
          : [...prev.sectors, sectorName],
      }));
      clearError("sectors");
    },
    [clearError],
  );

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (selectedCategory === "basic") {
      if (!formData.name.trim()) {
        newErrors.name = "Task name is required";
      }
      if (!formData.task_type_id) {
        newErrors.task_type_id = "Task type is required";
      }
      if (!formData.language_id) {
        newErrors.language_id = "Language is required";
      }
      if (
        formData.contributor_completion_time_limit !== null &&
        formData.contributor_completion_time_limit < 0
      ) {
        newErrors.contributor_completion_time_limit = "Cannot be negative";
      }
      if (
        formData.reviewer_completion_time_limit !== null &&
        formData.reviewer_completion_time_limit < 0
      ) {
        newErrors.reviewer_completion_time_limit = "Cannot be negative";
      }
      if (
        formData.max_expected_no_of_contributors !== null &&
        formData.max_expected_no_of_contributors < 0
      ) {
        newErrors.max_expected_no_of_contributors = "Cannot be negative";
      }
    }

    if (selectedCategory === "configuration") {
      if (
        !formData.max_contributor_per_micro_task ||
        formData.max_contributor_per_micro_task <= 0
      ) {
        newErrors.max_contributor_per_micro_task = "Must be greater than 0";
      }
      if (
        formData.max_contributor_per_facilitator !== null &&
        formData.max_contributor_per_facilitator < 0
      ) {
        newErrors.max_contributor_per_facilitator = "Cannot be negative";
      }
      if (
        formData.max_dataset_per_reviewer !== null &&
        formData.max_dataset_per_reviewer < 0
      ) {
        newErrors.max_dataset_per_reviewer = "Cannot be negative";
      }
      if (
        formData.max_reviewer_per_dataset !== null &&
        formData.max_reviewer_per_dataset <= 0
      ) {
        newErrors.max_reviewer_per_dataset = "Must be greater than 0";
      }
      if (
        formData.contributor_completion_time_limit !== null &&
        formData.contributor_completion_time_limit < 0
      ) {
        newErrors.contributor_completion_time_limit = "Cannot be negative";
      }
      if (
        formData.reviewer_completion_time_limit !== null &&
        formData.reviewer_completion_time_limit < 0
      ) {
        newErrors.reviewer_completion_time_limit = "Cannot be negative";
      }
      if (
        formData.max_retry_per_task !== null &&
        formData.max_retry_per_task < 0
      ) {
        newErrors.max_retry_per_task = "Cannot be negative";
      }
      if (
        !formData.appriximate_time_per_batch ||
        formData.appriximate_time_per_batch <= 0
      ) {
        newErrors.appriximate_time_per_batch = "Must be greater than 0";
      }
      if (
        formData.max_expected_no_of_contributors !== null &&
        formData.max_expected_no_of_contributors < 0
      ) {
        newErrors.max_expected_no_of_contributors = "Cannot be negative";
      }
      if (
        !formData.max_micro_task_per_contributor ||
        formData.max_micro_task_per_contributor <= 0
      ) {
        newErrors.max_micro_task_per_contributor = "Must be greater than 0";
      }
      if (formData.batch !== null && formData.batch < 0) {
        newErrors.batch = "Cannot be negative";
      }
      if (
        formData.batch != null &&
        formData.max_micro_task_per_contributor != null &&
        formData.batch > formData.max_micro_task_per_contributor
      ) {
        newErrors.batch =
          "Must be less than maximum assignment per contributor";
      }

      if (!isTextAudio) {
        if (
          !formData.minimum_characters_length ||
          formData.minimum_characters_length <= 0
        ) {
          newErrors.minimum_characters_length = "Must be greater than 0";
        }
        if (
          !formData.maximum_characters_length ||
          formData.maximum_characters_length <= 0
        ) {
          newErrors.maximum_characters_length = "Must be greater than 0";
        }
        if (
          (formData.minimum_characters_length ?? 0) >=
          (formData.maximum_characters_length ?? 0)
        ) {
          newErrors.minimum_characters_length =
            "Must be less than maximum characters length";
        }
      }

      if (isTextAudio) {
        if (!formData.minimum_seconds || formData.minimum_seconds <= 0) {
          newErrors.minimum_seconds = "Must be greater than 0";
        }
        if (!formData.maximum_seconds || formData.maximum_seconds <= 0) {
          newErrors.maximum_seconds = "Must be greater than 0";
        }
        if (
          formData.minimum_seconds != null &&
          formData.maximum_seconds != null &&
          formData.minimum_seconds >= formData.maximum_seconds
        ) {
          newErrors.minimum_seconds = "Must be less than maximum seconds";
        }
      }
    }

    if (selectedCategory === "demographics") {
      if (formData.is_dialect_specific && !formData.dialects.length) {
        newErrors.dialects = "At least one dialect is required";
      }
      if (formData.is_age_specific) {
        if (
          !formData.age?.min ||
          !formData.age?.max ||
          formData.age.min <= 0 ||
          formData.age.max <= 0
        ) {
          newErrors.age = "Both min and max age must be greater than 0";
        } else if (formData.age.min >= formData.age.max) {
          newErrors.age = "Minimum age must be less than maximum age";
        }
      }
      if (
        formData.is_gender_specific &&
        !formData.gender.male &&
        !formData.gender.female
      ) {
        newErrors.gender = "Please select a gender distribution";
      }
    }

    if (selectedCategory === "location") {
      if (formData.is_sector_specific && !formData.sectors.length) {
        newErrors.sectors = "At least one sector is required";
      }
      if (formData.is_location_specific && !formData.locations.length) {
        newErrors.locations = "Location name is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, selectedCategory, isTextAudio]);

  // ── Mutation ───────────────────────────────────────────────────────────────

  const updateTaskMutation = useMutation({
    mutationFn: async (taskData: UpdateTaskFormState) => {
      if (!session?.access_token)
        throw new Error("No authentication token available");

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/project-mgmt/task/${taskData.id}/requirement`,
        {
          max_contributor_per_micro_task:
            taskData.max_contributor_per_micro_task,
          max_contributor_per_facilitator:
            taskData.max_contributor_per_facilitator,
          appriximate_time_per_batch: taskData.appriximate_time_per_batch,
          reviewer_payment_per_microtask:
            taskData.reviewer_payment_per_microtask,
          contributor_payment_per_microtask:
            taskData.contributor_payment_per_microtask,
          max_retry_per_task: taskData.max_retry_per_task,
          expected_number_of_total_contributors:
            taskData.expected_number_of_total_contributors,
          // FIX: was missing from mutation payload
          max_expected_no_of_contributors:
            taskData.max_expected_no_of_contributors,
          max_micro_task_per_contributor:
            taskData.max_micro_task_per_contributor,
          batch: taskData.batch,
          is_dialect_specific: taskData.is_dialect_specific,
          dialects: taskData.is_dialect_specific ? taskData.dialects : [],
          is_age_specific: taskData.is_age_specific,
          age: taskData.is_age_specific ? taskData.age : { min: 0, max: 0 },
          is_sector_specific: taskData.is_sector_specific,
          sectors: taskData.is_sector_specific ? taskData.sectors : [],
          maximum_characters_length: taskData.maximum_characters_length,
          minimum_characters_length: taskData.minimum_characters_length,
          contributor_completion_time_limit:
            taskData.contributor_completion_time_limit != null
              ? taskData.contributor_completion_time_limit * HOURS_PER_DAY
              : null,
          reviewer_completion_time_limit:
            taskData.reviewer_completion_time_limit != null
              ? taskData.reviewer_completion_time_limit * HOURS_PER_DAY
              : null,
          max_dataset_per_reviewer: taskData.max_dataset_per_reviewer,
          max_reviewer_per_dataset: taskData.max_reviewer_per_dataset,
          is_gender_specific: taskData.is_gender_specific,
          gender: taskData.is_gender_specific
            ? taskData.gender
            : { male: 0, female: 0 },
          is_location_specific: taskData.is_location_specific,
          locations: taskData.is_location_specific ? taskData.locations : [],
          ...(isTextAudio && {
            minimum_seconds: taskData.minimum_seconds,
            maximum_seconds: taskData.maximum_seconds,
          }),
        },
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Task updated successfully");
      queryClient.invalidateQueries({ queryKey: ["task"] });
      onCancel();
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ?? "Failed to update task";
        const details = error.response?.data?.errors
          ? `: ${JSON.stringify(error.response.data.errors)}`
          : "";
        toast.error(`${message}${details}`);
      } else {
        toast.error("An unexpected error occurred");
      }
    },
  });

  const updateBasicMutation = useUpdateBasicTAsk();

  const handleSubmit = useCallback(async () => {
    if (validate()) {
      if (selectedCategory === "basic") {
        await updateBasicMutation.mutateAsync({
          id: formData.id,
          name: formData.name,
          description: formData.description,
          task_type_id: formData.task_type_id,
          language_id: formData.language_id,
          is_public: formData.is_public,
          require_contributor_test: formData.require_contributor_test,
          contributor_completion_time_limit:
            formData.contributor_completion_time_limit != null
              ? formData.contributor_completion_time_limit * HOURS_PER_DAY
              : null,
          reviewer_completion_time_limit:
            formData.reviewer_completion_time_limit != null
              ? formData.reviewer_completion_time_limit * HOURS_PER_DAY
              : null,
          max_expected_no_of_contributors:
            formData.max_expected_no_of_contributors,
        });
        onCancel();
      } else {
        await updateTaskMutation.mutateAsync(formData);
      }
    }
  }, [validate, updateTaskMutation, updateBasicMutation, formData, selectedCategory, onCancel]);

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!session?.access_token) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          Authentication required. Please sign in to continue.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="animate-spin text-gray-400 w-6 h-6" />
      </div>
    );
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  const numericInput = (
    name: keyof UpdateTaskFormState,
    label: string,
    opts: { description?: string; allowNull?: boolean } = {},
  ) => (
    <Field label={label} error={errors[name]} description={opts.description}>
      <input
        id={name}
        type="number"
        name={name}
        min={0}
        value={
          formData[name] === null || formData[name] === undefined
            ? ""
            : String(formData[name])
        }
        onChange={handleChange}
        className={`border rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          errors[name] ? "border-red-400" : "border-gray-300"
        }`}
      />
    </Field>
  );

  const toggle = (name: keyof UpdateTaskFormState, label: string) => (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        name={name}
        checked={!!formData[name]}
        onChange={handleChange}
        className="w-4 h-4 accent-blue-600"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );

  // ── Section renderers ──────────────────────────────────────────────────────

  const renderBasic = () => (
    <div className="flex flex-col gap-5">
      <Field label="Task Name" error={errors.name}>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter task name"
          className={`border rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? "border-red-400" : "border-gray-300"
          }`}
        />
      </Field>

      <Field label="Description">
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter description"
          rows={3}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Task Type" error={errors.task_type_id}>
          <select
            name="task_type_id"
            value={formData.task_type_id}
            onChange={handleChange}
            className={`border rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.task_type_id ? "border-red-400" : "border-gray-300"
            }`}
          >
            <option value="">Select task type</option>
            {taskTypeOptions.map((t: { id: string; name: string }) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Language" error={errors.language_id}>
          <select
            name="language_id"
            value={formData.language_id}
            onChange={handleChange}
            className={`border rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.language_id ? "border-red-400" : "border-gray-300"
            }`}
          >
            <option value="">Select language</option>
            {languageOptions.map((l: { id: string; name: string }) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>

        {numericInput(
          "contributor_completion_time_limit",
          "Contributor completion time limit (days)",
          {
            description:
              "Maximum number of days contributors have to complete a microtask after assignment.",
          },
        )}

        {numericInput(
          "reviewer_completion_time_limit",
          "Reviewer completion time limit (days)",
          {
            description:
              "Maximum number of days reviewers have to complete a review after assignment.",
          },
        )}

        {numericInput(
          "max_expected_no_of_contributors",
          "Maximum expected total contributors",
          {
            description:
              "The highest number of contributors anticipated or allowed to participate in this task.",
          },
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2">
        {toggle("is_public", "Public (any contributor can join)")}
        {toggle("require_contributor_test", "Require contributor test")}
      </div>
    </div>
  );

  const renderDemographics = () => (
    <div className="flex flex-col gap-6">
      {/* Dialect */}
      <div className="flex flex-col gap-3">
        {toggle("is_dialect_specific", "Dialect-specific task")}
        {formData.is_dialect_specific && (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-gray-700">Select Dialects</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {dialectOptions.map((d: DialectOption) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleDialectToggle(d.id)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    formData.dialects.some((sel) => sel.id === d.id)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
            {errors.dialects && (
              <p className="text-xs text-red-500">{errors.dialects}</p>
            )}
          </div>
        )}
      </div>

      {/* Age */}
      <div className="flex flex-col gap-3">
        {toggle("is_age_specific", "Age-specific task")}
        {formData.is_age_specific && (
          <div className="flex gap-4">
            <Field label="Min Age" error={errors.age}>
              <input
                type="number"
                min={1}
                value={formData.age?.min ?? ""}
                onChange={(e) =>
                  handleNestedChange(
                    "age",
                    "min",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="Max Age">
              <input
                type="number"
                min={1}
                value={formData.age?.max ?? ""}
                onChange={(e) =>
                  handleNestedChange(
                    "age",
                    "max",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
          </div>
        )}
      </div>

      {/* Gender */}
      <div className="flex flex-col gap-3">
        {toggle("is_gender_specific", "Gender-specific task")}
        {formData.is_gender_specific && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-6">
              {["Male", "Female"].map((g) => (
                <label
                  key={g}
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <input
                    type="radio"
                    name="genderSelect"
                    value={g}
                    checked={
                      g === "Male"
                        ? formData.gender.male === 100
                        : formData.gender.female === 100
                    }
                    onChange={handleGenderChange}
                    className="accent-blue-600"
                  />
                  {g}
                </label>
              ))}
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="genderSelect"
                  value="Both"
                  checked={
                    formData.gender.male > 0 && formData.gender.female > 0
                  }
                  onChange={() => {
                    setFormData((prev) => ({
                      ...prev,
                      gender: { male: 50, female: 50 },
                    }));
                    clearError("gender");
                  }}
                  className="accent-blue-600"
                />
                Both
              </label>
            </div>

            {formData.gender.male > 0 && formData.gender.female > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-gray-500">
                  Male: {formData.gender.male}% / Female:{" "}
                  {formData.gender.female}%
                </p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={formData.gender.male}
                  onChange={handleGenderPercentage}
                  className="w-full accent-blue-600"
                />
              </div>
            )}
            {errors.gender && (
              <p className="text-xs text-red-500">{errors.gender}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderLocation = () => (
    <div className="flex flex-col gap-6">
      {/* Sector */}
      <div className="flex flex-col gap-3">
        {toggle("is_sector_specific", "Sector-specific task")}
        {formData.is_sector_specific && (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-gray-700">Select Sectors</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {sectorOptions.map((s: { id: string; name: string }) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSectorToggle(s.name)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    formData.sectors.includes(s.name)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
            {errors.sectors && (
              <p className="text-xs text-red-500">{errors.sectors}</p>
            )}
          </div>
        )}
      </div>

      {/* Location */}
      <div className="flex flex-col gap-3">
        {toggle("is_location_specific", "Location-specific task")}
        {formData.is_location_specific && (
          <Field label="Location" error={errors.locations}>
            <input
              type="text"
              value={formData.locations.join(", ")}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  locations: e.target.value
                    .split(",")
                    .map((l) => l.trim())
                    .filter(Boolean),
                }))
              }
              placeholder="Enter locations, comma-separated"
              className={`border rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.locations ? "border-red-400" : "border-gray-300"
              }`}
            />
          </Field>
        )}
      </div>
    </div>
  );

  const renderConfiguration = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {numericInput(
        "max_contributor_per_micro_task",
        "Maximum submission per microtask",
        {
          description:
            "Refers to the maximum number of submission that can be given for a single micro task. This limit helps control the volume of submissions per micro task, ensures fair participation among microtasks, and maintains the quality and manageability of the collected data. Once the specified limit is reached, the system will prevent additional submissions and assignments for that microtask.",
        },
      )}
      {numericInput(
        "max_contributor_per_facilitator",
        "Maximum contributors assignment per facilitator",
        {
          description:
            "Refers to the maximum number of contributors that can be assigned to a facilitator for monitoring and follow-up. This limit helps ensure that facilitators can effectively supervise contributors, provide guidance when needed, and maintain the quality and progress of assigned tasks.",
        },
      )}
      {numericInput(
        "max_dataset_per_reviewer",
        "Maximum assignment per reviewer",
        {
          description:
            "Refers to the maximum number of submissions or microtasks that can be assigned to a reviewer at a given time. This limit helps balance the review workload among reviewers, prevents overloading a single reviewer, and ensures that submissions are reviewed efficiently and within the expected timeframe.",
        },
      )}
      {numericInput(
        "max_reviewer_per_dataset",
        "Maximum reviewer per dataset",
        {
          description:
            "Refers to the maximum number of reviewers that can be assigned to review a single dataset submission. This setting helps ensure that each dataset receives the required number of independent reviews for quality assurance, validation, and accuracy before a final decision is made.",
        },
      )}
      {numericInput(
        "max_micro_task_per_contributor",
        "Maximum microtasks per contributor",
        {
          description:
            "Refers to the highest number of microtasks that a single contributor is allowed to work on or submit. This limit helps distribute work fairly among contributors, prevent overloading individuals, and maintain balanced progress across the project.",
        },
      )}
      {numericInput("batch", "Batch Size")}
      {numericInput(
        "appriximate_time_per_batch",
        "Approximate time to finish task (min)",
        {
          description:
            "Refers to the estimated duration, measured in minutes, that a contributor is expected to spend completing a task.",
        },
      )}
      {numericInput(
        "contributor_completion_time_limit",
        "Contributor completion time limit (days)",
        {
          description:
            "Refers to the maximum amount of time, measured in days, that contributors are given to complete and submit their work for a microtask after it has been assigned. This setting helps ensure tasks are completed within a defined timeframe and allows the system to manage task availability, deadlines, and reassignment if the task is not completed within the specified period.",
        },
      )}
      {numericInput(
        "reviewer_completion_time_limit",
        "Reviewer completion time limit (days)",
        {
          description:
            "Refers to the maximum amount of time, measured in days, that reviewers are given to complete and submit their work for a microtask after it has been assigned. This setting helps ensure tasks are completed within a defined timeframe and allows the system to manage task availability, deadlines, and reassignment if the task is not completed within the specified period.",
        },
      )}
      {numericInput("max_retry_per_task", "Maximum retry per microtask", {
        description:
          "Refers to the maximum number of times a contributor is allowed to resubmit or attempt a single microtask after an initial submission. This limit helps maintain task integrity, prevents excessive retries, and ensures timely progression of work.",
      })}
      {numericInput(
        "expected_number_of_total_contributors",
        "Expected Total Contributors",
      )}
      {numericInput(
        "max_expected_no_of_contributors",
        "Maximum expected total contributors",
        {
          description:
            "Refers to the highest number of contributors anticipated or allowed to participate in a task or project. This setting helps plan resource allocation, manage task distribution, and ensure the project can handle the expected workload efficiently.",
        },
      )}
      {isTextAudio ? (
        <>
          {numericInput(
            "minimum_seconds",
            "Minimum recording length (seconds)",
            {
              description:
                "Refers to the shortest duration in seconds that an audio dataset or submission must meet to be considered valid for a task.",
            },
          )}
          {numericInput(
            "maximum_seconds",
            "Maximum recording length (seconds)",
            {
              description:
                "Refers to the longest duration in seconds that an audio dataset or submission must meet to be considered valid for a task.",
            },
          )}
        </>
      ) : (
        <>
          {numericInput(
            "minimum_characters_length",
            "Minimum characters length",
          )}
          {numericInput(
            "maximum_characters_length",
            "Maximum characters length",
          )}
        </>
      )}
    </div>
  );

  // ── Active category label ──────────────────────────────────────────────────

  const activeCategory = CATEGORIES.find((c) => c.key === selectedCategory);

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-lg">
      {/* Header */}
      {activeCategory && (
        <div className="flex flex-col gap-1 border-b pb-4">
          <h2 className="text-base font-semibold text-gray-900">
            {activeCategory.label}
          </h2>
          <p className="text-sm text-gray-500">{activeCategory.description}</p>
        </div>
      )}

      {/* Section content */}
      <div>
        {selectedCategory === "basic" && renderBasic()}
        {selectedCategory === "demographics" && renderDemographics()}
        {selectedCategory === "location" && renderLocation()}
        {selectedCategory === "configuration" && renderConfiguration()}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={updateTaskMutation.isPending || updateBasicMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={updateTaskMutation.isPending || updateBasicMutation.isPending}
          style={{ backgroundColor: "#095FAF" }}
          className="text-white"
        >
          {(updateTaskMutation.isPending || updateBasicMutation.isPending) ? (
            <>
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
              Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
};

export default UpdateTask;
