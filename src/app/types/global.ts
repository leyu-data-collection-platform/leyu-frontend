

export interface UserData {
  id: string;
  middle_name: string;
  first_name: string;
  last_name: string;
  email: string;
  gender: string;
  birth_date: string;
  password?: string;
  phone_number?: string;
  phoneNumber?: string;
  countryCode?: string;
  status: string;
  created_date: string;
  score?: number | null;
  referral_code?: string | null;
  role_id: string
  language: string | { id: string; name: string; code?: string; created_by?: string; updated_by?: string; created_date?: string; updated_date?: string; deletedAt?: string; }
  dialect: string | { id: string; name: string; code?: string; created_by?: string; updated_by?: string; created_date?: string; updated_date?: string; deletedAt?: string; }
  city: string | { id: string; name: string; code?: string; created_by?: string; updated_by?: string; created_date?: string; updated_date?: string; deletedAt?: string; }
  woreda: string | { id: string; name: string; code?: string; created_by?: string; updated_by?: string; created_date?: string; updated_date?: string; deletedAt?: string; }
  image?: string | null;
  is_active: boolean;
  role: string | {
    id: string;
    name: string;
    code?: string;
    created_by?: string;
    updated_by?: string;
    created_date?: string;
    updated_date?: string;
    deletedAt?: string;
  };

}
export interface ResetPassword {
  code: string;
  password: string;
  username: string;
}
export interface InvitationLinkData {
  id: string;
  role: string;
  organization: string;
  link: string;
  dateCreated: string;
}
export interface UserTaskSpecfic {
  email: string,
  first_name: string,
  gender: string,
  id: string,
  is_active: boolean,
  last_name: string,
  membership_id: string,
  middle_name?: string,
  phone_number: string,
  role: string,
  score: string,
  status: boolean,
}
export interface UserTask {
  user: {
    id: string;
    middle_name: string;
    first_name: string;
    last_name: string;
    email: string;
    gender: string;
    birth_date: string;
    password?: string;
    phoneNumber?: string;
    phone_number: string;
    countryCode?: string;
    status: string;
    is_active: boolean;
    created_date: string;
    role_id: string
    image?: string | null;

  },
  score?: {
    id: string,
    user_id: string,
    score: number
  },
  id: string;
  middle_name: string;
  first_name: string;
  last_name: string;
  email: string;
  gender: string;
  birth_date: string;
  password?: string;
  phoneNumber?: string;
  phone_number: string;
  countryCode?: string;
  status: string;
  is_active: boolean;
  created_date: string;
  role_id: string
  image?: string | null;
  role: string;

}
export interface TaskMembers {
  membership_id: string;
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  gender: string;
  is_active: boolean;
  score: number;
  submission_count?: number;
  status: string;
  role: string;
  referral_code?: string;
  middle_name?:string;
}
export interface User {
  id: string;
  middle_name: string;
  first_name: string;
  last_name: string;
  email: string;
  gender: string;
  birth_date: string;
  password?: string;
  phoneNumber?: string;
  phone_number?: string;
  countryCode?: string;
  status: string;
  is_active: boolean;
  created_date: string;
  role_id: string
  image?: string | null;
}
export interface Project_User {
  user: User
  id: string;
  user_id: string,
  task_id: string,
  role: string,
  status: string,
  is_flagged: boolean,
  created_date: string,
  updated_date: string,

}

export interface NewUser {

  middle_name: string;
  first_name: string;
  last_name: string;
  email: string;
  gender: string;
  birth_date: string;
  role_id: string;
  password: string
  phone_number?: string;
  dialect_id?: string;
  language_id?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  language: string;
  status: "active" | "inactive";
  criteria: string;
  deadline: string;
  createdAt: string;
}
export interface UpdatePassword {
  current_password: string;
  new_password: string;
}
export interface UserLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: string;
  user_agent: string;
  ip: string;
  created_date: string;
  updated_date: string;
}


export interface MeResponse {
  id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  profile_picture: string | null;
  birth_date: string;
  gender: string;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_date: string;
  updated_date: string;
  language_id: string | null;
  dialect_id: string | null;
  role_id: string;
  woreda: string | null;
  city: string | null;
  zone_id: string | null;
  region_id: string | null;
  sectors: any | null;
  role: {
    id: string;
    name: string;
    description: string;
    created_by: string | null;
    updated_by: string | null;
    created_date: string;
    updated_date: string;
  };
  wallet: any | null;
  dialect: any | null;
  language: any | null;
  score: number | null;
  referral_code:string|null;
}

export interface UserMeResponse {
  id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  profile_picture: string | null;
  birth_date: string;
  gender: string;
  is_active: boolean;
  created_date: string;
  woreda: string | null;
  city: string | null;
  zone: string | null;
  zone_id: string | null;
  region: string | null;
  region_id: string | null;
  role: {
    id: string;
    name: string;
    created_date: string;
  };
  dialect: any | null;
  language: any | null;
}
export interface PaginationResponse<types> {
  code: string;
  data: {
    total: number;
    totalPages: number;
    limit: number;
    page: number;
    message: string;
    result: types[];
  };

}
export interface AllResponse<types> {
  code: string;
  message: string;
  data: types[];

}
export interface OneResponse<types> {
  code: string;
  message: string;
  data: types;

}

export interface SinglerResponse<types> {
  code: string;
  data: types;
  message: string;
}
