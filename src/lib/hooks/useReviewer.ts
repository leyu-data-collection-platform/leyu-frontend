import axios from "axios";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { NewProject, TaskCardType,TaskCardReviewer,RejectType, ReviewerDatset,TaskQA, NewTask, MicroTask, UpdateProject, Project, ProjectDetail, ProjectResponse, TaskResponse } from "@/app/types/project";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PaginationResponse, SinglerResponse, AllResponse, OneResponse } from "@/app/types/global";
interface NewTaskMicroTaskResponse extends PaginationResponse<ReviewerDatset> { }
interface NewProjectTaskResponse extends PaginationResponse<TaskCardType> { }
interface NewProjectTaskResponseQA extends PaginationResponse<TaskQA> { }
interface NewProjectTaskResponseList extends PaginationResponse<TaskCardReviewer> { }
interface NewProjectTaskResponseReviewer extends PaginationResponse<TaskCardReviewer> { }
interface RejectTypeALLResponse extends AllResponse<RejectType> { }
interface NewProjectrofileTaskProps {
    page: number
    pageSize: number;
    searchQuery?: string;
    verificationStatus?: string;
    token?: string;

}
interface FlagPayload {
    microTaskId: string;
    flag_type_id: string;
    comment: string
}
interface NewTaskMicroTaskProps {
    microTaskPage: number
    microTaskPageSize: number;
    searchQuery?: string;
    verificationStatus?: string;
    token?: string;
    taskId: string;
}
interface NewTaskMicroTasStatuskProps {
    microTaskPage: number
    microTaskPageSize: number;
    searchQuery?: string;
    verificationStatus?: string;
    token?: string;
    taskId: string;
    status: string;
    reviewerIds?: string[];
}
export function useGetProjectTask({
    page,
    pageSize,
    searchQuery,
    verificationStatus,
}: NewProjectrofileTaskProps) {
    const { data: session } = useSession();
    return useQuery<NewProjectTaskResponse>({
        queryKey: ["reviewer_tasks", page, pageSize, searchQuery, verificationStatus],
        queryFn: async () => {


            try {
                if (!session?.access_token) {
                    throw new Error("No authentication token available");
                }
                const params = new URLSearchParams({
                    page: String(page),
                    "limit": String(pageSize),
                    ...(searchQuery && { "search": searchQuery }),
                    ...(verificationStatus && { "verification-status": verificationStatus }),
                });

                const baseUrl =
                    process.env.NEXT_PUBLIC_API_BASE_URL;

                const response = await axios.get<NewProjectTaskResponse>(
                    `${baseUrl}/project-mgmt/task/reviewer_tasks?${params.toString()}`,

                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                );


                return response.data as NewProjectTaskResponse;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const message =
                        error.response?.data?.message || "Failed to task";
                    toast.error("Error", { description: message });
                }
                throw error;
            }
        },
        enabled: !!session?.access_token, // Only fetch when token is available
        retry: (failureCount, error) => {
            if (error.message === "No authentication token available") return false;
            return failureCount < 2;
        },
    });
};
export function useGetProjectTaskQA({
    page,
    pageSize,
    searchQuery,
    verificationStatus,
}: NewProjectrofileTaskProps) {
    const { data: session } = useSession();
    return useQuery<NewProjectTaskResponseQA>({
        queryKey: ["reviewer_tasks", page, pageSize, searchQuery, verificationStatus],
        queryFn: async () => {


            try {
                if (!session?.access_token) {
                    throw new Error("No authentication token available");
                }
                const params = new URLSearchParams({
                    page: String(page),
                    "limit": String(pageSize),
                    ...(searchQuery && { "search": searchQuery }),
                    ...(verificationStatus && { "verification-status": verificationStatus }),
                });

                const baseUrl =
                    process.env.NEXT_PUBLIC_API_BASE_URL;

                const response = await axios.get<NewProjectTaskResponseQA>(
                    `${baseUrl}/reviewer-task/qa/tasks?${params.toString()}`,

                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                );


                return response.data as NewProjectTaskResponseQA;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const message =
                        error.response?.data?.message || "Failed to task";
                    toast.error("Error", { description: message });
                }
                throw error;
            }
        },
        enabled: !!session?.access_token, // Only fetch when token is available
        retry: (failureCount, error) => {
            if (error.message === "No authentication token available") return false;
            return failureCount < 2;
        },
    });
};
export function useGetProjectTaskReviewerList({
    page,
    pageSize,
    searchQuery,
    verificationStatus,
}: NewProjectrofileTaskProps) {
    const { data: session } = useSession();
    return useQuery<NewProjectTaskResponseList>({
        queryKey: ["reviewer_tasks", page, pageSize, searchQuery, verificationStatus],
        queryFn: async () => {


            try {
                if (!session?.access_token) {
                    throw new Error("No authentication token available");
                }
                const params = new URLSearchParams({
                    page: String(page),
                    "limit": String(pageSize),
                    ...(searchQuery && { "search": searchQuery }),
                    ...(verificationStatus && { "verification-status": verificationStatus }),
                });

                const baseUrl =
                    process.env.NEXT_PUBLIC_API_BASE_URL;

                const response = await axios.get<NewProjectTaskResponseList>(
                    `${baseUrl}/project-mgmt/task/reviewer_tasks?${params.toString()}`,

                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                );


                return response.data as NewProjectTaskResponseList;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const message =
                        error.response?.data?.message || "Failed to task";
                    toast.error("Error", { description: message });
                }
                throw error;
            }
        },
        enabled: !!session?.access_token, // Only fetch when token is available
        retry: (failureCount, error) => {
            if (error.message === "No authentication token available") return false;
            return failureCount < 2;
        },
    });
};
export function useGetProjectTaskReviewer({
    page,
    pageSize,
    searchQuery,
    verificationStatus,
}: NewProjectrofileTaskProps) {
    const { data: session } = useSession();
    return useQuery<NewProjectTaskResponseReviewer>({
        queryKey: ["reviewer_tasks", page, pageSize, searchQuery, verificationStatus],
        queryFn: async () => {


            try {
                if (!session?.access_token) {
                    throw new Error("No authentication token available");
                }
                const params = new URLSearchParams({
                    page: String(page),
                    "limit": String(pageSize),
                    ...(searchQuery && { "search": searchQuery }),
                    ...(verificationStatus && { "verification-status": verificationStatus }),
                });

                const baseUrl =
                    process.env.NEXT_PUBLIC_API_BASE_URL;

                const response = await axios.get<NewProjectTaskResponseReviewer>(
                    `${baseUrl}/project-mgmt/task/reviewer_tasks?${params.toString()}`,

                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                );


                return response.data as NewProjectTaskResponseReviewer;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const message =
                        error.response?.data?.message || "Failed to task";
                    toast.error("Error", { description: message });
                }
                throw error;
            }
        },
        enabled: !!session?.access_token, // Only fetch when token is available
        retry: (failureCount, error) => {
            if (error.message === "No authentication token available") return false;
            return failureCount < 2;
        },
    });
};
export function useGetProjectTaskFacilitator({
    page,
    pageSize,
    searchQuery,
    verificationStatus,
}: NewProjectrofileTaskProps) {
    const { data: session } = useSession();
    return useQuery<NewProjectTaskResponse>({
        queryKey: ["reviewer_tasks", page, pageSize, searchQuery, verificationStatus],
        queryFn: async () => {


            try {
                if (!session?.access_token) {
                    throw new Error("No authentication token available");
                }
                const params = new URLSearchParams({
                    page: String(page),
                    "limit": String(pageSize),
                    ...(searchQuery && { "search": searchQuery }),
                    ...(verificationStatus && { "verification-status": verificationStatus }),
                });

                const baseUrl =
                    process.env.NEXT_PUBLIC_API_BASE_URL;

                const response = await axios.get<NewProjectTaskResponse>(
                    `${baseUrl}/project-mgmt/task/facilitator_tasks?${params.toString()}`,

                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                );


                return response.data as NewProjectTaskResponse;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const message =
                        error.response?.data?.message || "Failed to task";
                    toast.error("Error", { description: message });
                }
                throw error;
            }
        },
        enabled: !!session?.access_token, // Only fetch when token is available
        retry: (failureCount, error) => {
            if (error.message === "No authentication token available") return false;
            return failureCount < 2;
        },
    });
};
export function useGetTaskMicroTaskResponseForReviewers({
    microTaskPage,
    microTaskPageSize,
    searchQuery,
    verificationStatus,
    token,
    status,
    taskId
}: NewTaskMicroTasStatuskProps) {
    const { data: session } = useSession();
    return useQuery<NewTaskMicroTaskResponse>({
        queryKey: ["taskMicroTasksResultReviewers", taskId, status, microTaskPage, microTaskPageSize, searchQuery, verificationStatus],
        queryFn: async () => {


            try {
                if (!session?.access_token) {
                    throw new Error("No authentication token available");
                }
                const params = new URLSearchParams({
                    page: String(microTaskPage),
                    "limit": String(microTaskPageSize),
                    ...(searchQuery && { "search": searchQuery }),
                    ...(verificationStatus && { "verification-status": verificationStatus }),
                });

                const baseUrl =
                    process.env.NEXT_PUBLIC_API_BASE_URL;
                if (status) {
                    params.append("status", status);
                }
                const response = await axios.get<NewTaskMicroTaskResponse>(
                    `${baseUrl}/reviewer-task/my-tasks/${taskId}?${params.toString()}`,

                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                );

                return response.data as NewTaskMicroTaskResponse;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const message =
                        error.response?.data?.message || "Failed to fetch User profiles";
                    toast.error("Error", { description: message });
                }
                throw error;
            }
        },
        enabled: !!session?.access_token && !!taskId,
        staleTime: 1000 * 60 * 5, // 5 minutes — prevent background refetches from wiping reviewed items
        refetchOnMount: true,
        refetchOnWindowFocus: false, // Prevent refetch when dialog closes and window regains focus
        retry: (failureCount, error) => {
            if (error.message === "No authentication token available") return false;
            return failureCount < 2;
        },
    });
};
export function useGetTaskMicroTaskResponseForReviewersQA({
    microTaskPage,
    microTaskPageSize,
    searchQuery,
    verificationStatus,
    token,
    status,
    taskId,
    reviewerIds
}: NewTaskMicroTasStatuskProps) {
    const { data: session } = useSession();
    return useQuery<NewTaskMicroTaskResponse>({
        queryKey: ["taskMicroTasksResultReviewersQA", taskId, status, microTaskPage, microTaskPageSize, searchQuery, verificationStatus, reviewerIds],
        queryFn: async () => {


            try {
                if (!session?.access_token) {
                    throw new Error("No authentication token available");
                }
                const params = new URLSearchParams({
                    page: String(microTaskPage),
                    "limit": String(microTaskPageSize),
                    ...(searchQuery && { "search": searchQuery }),
                    ...(verificationStatus && { "verification-status": verificationStatus }),
                });

                const baseUrl =
                    process.env.NEXT_PUBLIC_API_BASE_URL;
                if (status) {
                    params.append("status", status);
                }
                
                // Add reviewer IDs to query params
                if (reviewerIds && reviewerIds.length > 0) {
                    reviewerIds.forEach((id) => {
                        params.append("reviewerIds", id);
                    });
                }
                
                const response = await axios.get<NewTaskMicroTaskResponse>(
                    `${baseUrl}/reviewer-task/qa/microtasks/${taskId}?${params.toString()}`,

                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                );

                return response.data as NewTaskMicroTaskResponse;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const message =
                        error.response?.data?.message || "Failed to fetch User profiles";
                    toast.error("Error", { description: message });
                }
                throw error;
            }
        },
        enabled: !!session?.access_token && !!taskId, // Only fetch when token and taskId are available
        staleTime: 0, // Always consider data stale
        refetchOnMount: true, // Refetch when component mounts
        retry: (failureCount, error) => {
            if (error.message === "No authentication token available") return false;
            return failureCount < 2;
        },
    });
};
export function useGetTaskMicroTaskResponseForFacilitator({
    microTaskPage,
    microTaskPageSize,
    searchQuery,
    verificationStatus,
    token,
    taskId
}: NewTaskMicroTaskProps) {
    const { data: session } = useSession();
    return useQuery<NewTaskMicroTaskResponse>({
        queryKey: ["taskMicroTasksResulFacilitator", microTaskPage, microTaskPageSize, searchQuery, verificationStatus],
        queryFn: async () => {


            try {
                if (!session?.access_token) {
                    throw new Error("No authentication token available");
                }
                const params = new URLSearchParams({
                    page: String(microTaskPage),
                    "limit": String(microTaskPageSize),
                    ...(searchQuery && { "search": searchQuery }),
                    ...(verificationStatus && { "verification-status": verificationStatus }),
                });

                const baseUrl =
                    process.env.NEXT_PUBLIC_API_BASE_URL;

                const response = await axios.get<NewTaskMicroTaskResponse>(
                    `${baseUrl}//reviewer-task/my-tasks/${taskId}?${params.toString()}`,

                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                );

                return response.data as NewTaskMicroTaskResponse;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const message =
                        error.response?.data?.message || "Failed to fetch User profiles";
                    toast.error("Error", { description: message });
                }
                throw error;
            }
        },
        enabled: !!session?.access_token, // Only fetch when token is available
        retry: (failureCount, error) => {
            if (error.message === "No authentication token available") return false;
            return failureCount < 2;
        },
    });
};

export function useGetTaskMicroTaskResponseForReviewersSubmission({
    microTaskPage,
    microTaskPageSize,
    searchQuery,
    verificationStatus,
    token,
    taskId
}: NewTaskMicroTaskProps) {
    const { data: session } = useSession();
    return useQuery<NewTaskMicroTaskResponse>({
        queryKey: ["taskMicroTasksResultReviewersSubmission", microTaskPage, microTaskPageSize, searchQuery, verificationStatus],
        queryFn: async () => {


            try {
                if (!session?.access_token) {
                    throw new Error("No authentication token available");
                }
                const params = new URLSearchParams({
                    page: String(microTaskPage),
                    "limit": String(microTaskPageSize),
                    ...(searchQuery && { "search": searchQuery }),
                    ...(verificationStatus && { "verification-status": verificationStatus }),
                });

                const baseUrl =
                    process.env.NEXT_PUBLIC_API_BASE_URL;

                const response = await axios.get<NewTaskMicroTaskResponse>(
                    `${baseUrl}/reviewer-task/approve${taskId}?${params.toString()}`,

                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                );

                return response.data as NewTaskMicroTaskResponse;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const message =
                        error.response?.data?.message || "Failed to fetch User profiles";
                    toast.error("Error", { description: message });
                }
                throw error;
            }
        },
        enabled: !!session?.access_token, // Only fetch when token is available
        retry: (failureCount, error) => {
            if (error.message === "No authentication token available") return false;
            return failureCount < 2;
        },
    });
};
export function useReject() {
    const res1 = useSession();
    const { data: session } = useSession();

    return useQuery<RejectTypeALLResponse>({
        queryKey: [`rejection-type-all`],
        queryFn: async () => {
            try {
                if (!session?.access_token) {
                    throw new Error("No authentication token available");
                }

                const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

                const response = await axios.get<RejectTypeALLResponse>(
                    `${baseUrl}/setting/rejection-type`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                );

                return response.data as RejectTypeALLResponse;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const message =
                        error.response?.data?.message ||
                        `Failed to fetch rejection-type`;
                    toast.error("Error", { description: message });
                }
                throw error;
            }
        },
        enabled: !!session?.access_token, // Only fetch when token is available
        retry: (failureCount, error) => {
            if (error.message === "No authentication token available") return false;
            return failureCount < 2;
        },
    });
}
export const useFlagMicrotask = () => {
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    return useMutation({
        mutationFn: async (payload: FlagPayload) => {
            var data = {
                flag_type_id: payload.flag_type_id,
                comment: payload.comment,
            };
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/workspace/data-set/flag/${payload.microTaskId}`,
                payload,
                {
                    headers: { Authorization: `Bearer ${session?.access_token}` },
                }
            );
            return response.data;
        },
    });
};
export const useApprove = () => {
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    return useMutation({
        mutationFn: async (userData: { microTaskId: string, annotation_id?: string, annotation?: string, annotationIds?:string [] }) => {
            if (!session?.access_token) {
                throw new Error("No authentication token available");
            }

            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/reviewer-task/approve/${userData.microTaskId}`,
                userData,
                {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                }
            );
            return response.data;
        },
        onError: (error) => {
            if (axios.isAxiosError(error)) {
                toast.error("Error", {
                    description: error.response?.data?.message || "Failed to update user",
                });
            }
        },
    });
};
export const useRejectionMicrotask = () => {
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    return useMutation({
        mutationFn: async (userData: {
            microTaskId: string,
            comment: string;
            rejection_type_ids: string[];
            flag?:boolean
        }) => {

            let data = {
                comment: userData.comment,
                rejection_type_ids: userData.rejection_type_ids,
                flag: userData.flag
            }
            if (!session?.access_token) {
                throw new Error("No authentication token available");
            }

            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/reviewer-task/reject/${userData.microTaskId}`,
                data,
                {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                }
            );
            return response.data;
        },
        onSuccess: () => {
            toast.success("Success", {
                description: "Rejected successfully",
            });
        },
        onError: (error) => {
            if (axios.isAxiosError(error)) {
                toast.error("Error", {
                    description: error.response?.data?.message || "Failed to update user",
                });
            }
        },
    });
};

export const useApproveQA = () => {
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    return useMutation({
        mutationFn: async (userData: { microTaskId: string, annotation_id?: string, annotation?: string, annotationIds?:string [] }) => {
            if (!session?.access_token) {
                throw new Error("No authentication token available");
            }

            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/reviewer-task/qa/approve/${userData.microTaskId}`,
                userData,
                {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                }
            );
            return response.data;
        },
        onSuccess: () => {
            toast.success("Success", {
                description: "Approved successfully",
            });
            queryClient.invalidateQueries({ queryKey: ["taskMicroTasksResultReviewers"] });
        },
        onError: (error) => {
            if (axios.isAxiosError(error)) {
                toast.error("Error", {
                    description: error.response?.data?.message || "Failed to update user",
                });
            }
        },
    });
};
export const useRejectionMicrotaskQA = () => {
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    return useMutation({
        mutationFn: async (userData: {
            microTaskId: string,
            comment: string;
            rejection_type_ids: string[];
            flag?:boolean
        }) => {

            let data = {
                comment: userData.comment,
                rejection_type_ids: userData.rejection_type_ids,
                flag: userData.flag
            }
            if (!session?.access_token) {
                throw new Error("No authentication token available");
            }

            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/reviewer-task/qa/reject/${userData.microTaskId}`,
                data,
                {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                }
            );
            return response.data;
        },
        onSuccess: () => {
            toast.success("Success", {
                description: "Rejected successfully",
            });
            queryClient.invalidateQueries({ queryKey: ["taskMicroTasksResultReviewers"] });
        },
        onError: (error) => {
            if (axios.isAxiosError(error)) {
                toast.error("Error", {
                    description: error.response?.data?.message || "Failed to update user",
                });
            }
        },
    });
};
