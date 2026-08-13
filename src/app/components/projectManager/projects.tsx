// pages/Projects.tsx
"use client";
import AddProjectModal from "@/app/components/project/addProjectModal";
import React, { useState, useEffect } from "react";
import ProjectCard from "./projectCard";
import TaskTable from "./taskTable";
import { MyProjectProfiles, useProjectDetails } from "@/lib/hooks/useProject";
import { ProjectDetail, Project, ProjectResponse } from "@/app/types/project";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FilterComponent } from "@/components/ui/filterComponent";
import { PaginationControls } from "@/components/ui/pagination";

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectDetail[]>([]);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [projectToUpdate, setProjectToUpdate] = useState<Project | null>(null);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [filters, setFilters] = useState<{ [key: string]: string | boolean }>(
    {}
  );
  const handleUpdateProjectClick = (project: Project) => {
    setProjectToUpdate(project);
    setIsUpdateModalOpen(true);
  };
  const handleFilterChange = (
    newFilters: { [key: string]: string | boolean },
    endpoint: string
  ) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] =
    useState<ProjectResponse | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [verificationStatus, setVerificationStatus] = useState<string>();
  const { data: parojectData, isLoading: isprojectLoading } = MyProjectProfiles(
    {
      page,
      pageSize,
      filters,
      searchQuery: debouncedSearch,
      verificationStatus,
    }
  );

  useEffect(() => {
    if (!isprojectLoading) {
      setLoading(false);
      setProjects(parojectData?.data.result || []);
    } else {
      const paginatedParojectData = projects || [];
    }
  }, [isprojectLoading, parojectData]);
  const router = useRouter();
  const handleTaskClick = (projectId: string) => {
    router.push(`/projectmanager/projectDetail/${projectId}`);
  };
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const paginatedParojectData = parojectData?.data.result || [];
  const parojectTotalElements = parojectData?.data?.total || 0;
  const parojectTotalPages = Math.ceil(parojectTotalElements / pageSize) || 0;
  const parojectStartRecord = paginatedParojectData.length
    ? (page - 1) * pageSize + 1
    : 0;
  const projectEndRecord = Math.min(page * pageSize, parojectTotalElements);
  const [taskLoading, setTaskLoading] = useState(false);
  const handleProjectClick = (project: ProjectResponse) => {
    setSelectedProject(project);
    setIsTaskModalOpen(true);
  };
  const handleProjectBackClick = () => {
    setSelectedProject(null);
    setIsTaskModalOpen(false);
  };
  {
  }
  const filterableColumns = [{ accessorKey: "name", header: "Name" }];
  return (
    <div className="p-2">
      {!isTaskModalOpen ? (
        <div>
          {paginatedParojectData.length === 0 ? (
            <div>
              <div className="flex justify-end items-center gap-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search Project..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <FilterComponent
                  columns={filterableColumns}
                  onFilterChangeAction={handleFilterChange}
                  initialFilters={filters}
                  endpoint={`/api/project-mgmt/project/manager/my-projects`}
                />
                <Button onClick={() => setIsAddProjectModalOpen(true)}>
                  + Create Project
                </Button>
              </div>

              <div className="relative flex flex-col items-center justify-center py-12">
                <img
                  src="/empty.svg"
                  alt="No projects found"
                  className="w-64 h-64 opacity-50"
                />

                {loading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div>
              <div className="flex justify-end items-center gap-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search Project..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <FilterComponent
                  columns={filterableColumns}
                  onFilterChangeAction={handleFilterChange}
                  initialFilters={filters}
                  endpoint={`/api/project-mgmt/project/manager/my-projects`}
                />
                <Button onClick={() => setIsAddProjectModalOpen(true)}>
                  + Create Project
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedParojectData.map((project) => (
                  <ProjectCard
                    key={project.id}
                    cover_image_url={project.cover_image_url}
                    id={project.id}
                    start_date={project.start_date}
                    end_date={project.end_date}
                    manager_id={project.manager_id}
                    created_by={project.created_by}
                    updated_by={project.updated_by}
                    created_date={project.created_date}
                    updated_date={project.updated_date}
                    title={project.name}
                    manager={project.manager}
                    status={
                      project.status.toLowerCase() === "active"
                        ? "Active"
                        : project.status === "inactive"
                          ? "Inactive"
                          : "Inactive"
                    }
                    description={project.description}
                    onViewProject={() => handleTaskClick(project.id)}
                    tags={project.tags ? project.tags.map((tag) => tag) : null}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between py-4">
                <PaginationControls
                  pagination={{
                    pageCount: parojectTotalPages,
                    page: page,
                    setPage: setPage,
                    pageSize: pageSize,
                    setPageSize: setPageSize,
                    showingText:
                      parojectTotalElements > 0
                        ? `Showing ${parojectStartRecord} to ${projectEndRecord} out of ${parojectTotalElements} records`
                        : "",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {selectedProject && (
            <div className="-mt-27 ">
              <TaskTable
                projectId={selectedProject.id}
                manager={selectedProject.manager}
                cover_image_url={selectedProject.cover_image_url}
                projectTitle={selectedProject.name}
                projectStatus={selectedProject.status}
                createdOn={selectedProject.start_date}
                lastUpdated={selectedProject.end_date}
                description={selectedProject.description}
              />
            </div>
          )}
        </div>
      )}

      {isAddProjectModalOpen && (
        <AddProjectModal onClose={() => setIsAddProjectModalOpen(false)} />
      )}
    </div>
  );
};

export default ProjectsPage;
