export interface StatisticsSuperadmin {
    "total_micro_tasks": number,
    "total_projects": number,
    "total_tasks": number,
    "total_contributors": number,
    "total_facilitators": number,
    "total_project_managers": number,
    "total_reviewers": number,
    "total_languages": number,
    "total_dialects": number
}
export interface StatisticsProject {
    "total_micro_tasks": number,
    "total_tasks": number,
    "total_contributors": number,
    "total_facilitators": number,
    "total_reviewers": number,
    "total_data_sets": number,
    "project": {
        id: string,
        name: string
    }

}

export interface StatisticsTask {
    "total_data_sets": number,
    "total_micro_tasks": number,
    "total_contributors": number,
    "total_facilitators": number,
    "total_reviewers": number,
}

export interface StatisticsProjectContributer {
    "pending_micro_tasks": number,
    "completed_micro_tasks": number,
    "rejected_datasets": number,
    "under_review_datasets": number,
    "total_submitted_hrs": number,
    "total_expired_micro_tasks": number,
   

}
export interface StatisticsProjectDatasetLanguage {
    "dialect_id": string,
    "dialect_name": string,
    "language_id": string,
    "language_name": string,
    "count": string

}
export interface SuperAdminDatasetLanguage extends Array<StatisticsProjectDatasetLanguage> { }
interface StatisticsData_setsData {
    date: number;
    count: string;
}

export interface StatisticsData_sets extends Array<StatisticsData_setsData> { }