"use client";

import { Button } from "@/components/ui/button";
import { useAddUser } from "@/lib/hooks/useFetchUser";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { countryCodes } from "@/app/types/countryCodes";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface Role {
  id: string;
  name: string;
  description: string;
}

interface RolesResponse {
  message: string;
  code: number;
  data: Role[];
}
interface Language {
  id: string;
  name: string;
}

interface LanguageResponse {
  message: string;
  code: number;
  data: Language[];
}

interface Dialect {
  id: string;
  name: string;
  description: string;
}

interface DialectResponse {
  message: string;
  code: number;
  data: Dialect[];
}

export default function AddUserForm({
  oncloseAction,
}: {
  oncloseAction: () => void;
}) {
  const { data: session } = useSession();
  const { t } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const languageId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      language_id: languageId,
    }));
  };

  const handleDialectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dialectId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      dialect_id: dialectId,
    }));
  };

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    password: "",
    birth_date: "",
    gender: "",
    role_id: "",
    phone: "",
    language_id: "",
    dialect_id: "",
  });

  const getMaxBirthDate = (): string => {
    const date = new Date();
    date.setDate(date.getDate() - 1); // Yesterday
    return date.toISOString().split("T")[0];
  };

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState({
    isStrong: false,
    message: "",
  });

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    const isStrong =
      minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

    let message = "";
    if (!minLength) message = "Password must be at least 8 characters long.";
    else if (!hasUpperCase)
      message = "Password must contain at least one uppercase letter.";
    else if (!hasLowerCase)
      message = "Password must contain at least one lowercase letter.";
    else if (!hasNumber) message = "Password must contain at least one number.";
    else if (!hasSpecialChar)
      message =
        "Password must contain at least one special character (!@#$%^&*).";

    return { isStrong, message };
  };

  const defaultCountryCode =
    countryCodes.find((country) => country.code === "ET")?.dial_code || "+251";
  const [selectedCountryCode, setSelectedCountryCode] =
    useState(defaultCountryCode);

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData({ ...formData, password });
    const { isStrong, message } = validatePassword(password);
    setPasswordStrength({ isStrong, message });
  };

  // Fetch languages
  const { data: languageResponseData, isLoading: languageLoading } =
    useQuery<LanguageResponse>({
      queryKey: ["language"],
      queryFn: async () => {
        if (!session?.access_token) throw new Error("No authentication token");
        const response = await axios.get<LanguageResponse>(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/setting/language/all`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );
        return response.data;
      },
      enabled: !!session?.access_token,
    });

  // Fetch roles
  const { data: rolesResponse, isLoading: rolesLoading } =
    useQuery<RolesResponse>({
      queryKey: ["roles"],
      queryFn: async () => {
        if (!session?.access_token) throw new Error("No authentication token");
        const response = await axios.get<RolesResponse>(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/iam/auth/roles`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );
        return response.data;
      },
      enabled: !!session?.access_token,
    });

  // Fetch dialects
  const { data: dialectResponseData, isLoading: dialectsLoading } =
    useQuery<DialectResponse>({
      queryKey: ["dialects", formData.language_id],
      queryFn: async () => {
        if (!session?.access_token) throw new Error("No authentication token");
        const response = await axios.get<DialectResponse>(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/setting/dialect/language/${formData.language_id}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );
        return response.data;
      },
      enabled: !!session?.access_token && !!formData.language_id,
    });

  const addUserMutation = useAddUser();

  const selectedRoleName = rolesResponse?.data?.find(
    (r) => r.id === formData.role_id
  )?.name;

  const hideLanguageAndDialect = !formData.role_id;

  useEffect(() => {
    if (
      hideLanguageAndDialect &&
      (formData.language_id || formData.dialect_id)
    ) {
      setFormData((prev) => ({ ...prev, language_id: "", dialect_id: "" }));
    }
  }, [hideLanguageAndDialect]);

  const getMinBirthDate = (): string => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().split("T")[0];
  };

  const [birthDateError, setBirthDateError] = useState<string | null>(null);

  const validateBirthDate = (dateStr: string): boolean => {
    if (!dateStr) return false;

    const selected = new Date(dateStr);
    const minDate = new Date(getMinBirthDate());
    const today = new Date();

    if (selected > today) {
      setBirthDateError("Date of birth cannot be in the future.");
      return false;
    }

    if (selected > minDate) {
      setBirthDateError("User must be at least 18 years old.");
      return false;
    }

    setBirthDateError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateBirthDate(formData.birth_date)) {
      toast.error(birthDateError || "Invalid date of birth.");
      return;
    }

    const { isStrong, message } = validatePassword(formData.password);
    if (!isStrong) {
      toast.error(message || "Please provide a stronger password.");
      return;
    }

    const phoneDigits = formData.phone.replace(/[^0-9]/g, "");
    const phoneWithCountryCode = `${selectedCountryCode}${phoneDigits}`;
    const minLength = selectedCountryCode === "+251" ? 9 : 10;

    if (phoneDigits.length < minLength) {
      toast.error(`Phone number must be at least ${minLength} digits long.`);
      return;
    }

    try {
      const userPayload: any = {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        email: formData.email,
        birth_date: formData.birth_date,
        gender: formData.gender,
        role_id: formData.role_id,
        password: formData.password,
        phone_number: phoneWithCountryCode,
      };

      if (formData.language_id) userPayload.language_id = formData.language_id;
      if (formData.dialect_id) userPayload.dialect_id = formData.dialect_id;

      await addUserMutation.mutateAsync(userPayload);
      toast.success("User created successfully!");
      oncloseAction();
    } catch (error: any) {
      console.error("Error creating user:", error);
      const errMsg = error?.response?.data?.message || "Failed to create user";
      toast.error(errMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 overflow-x-hidden">
    
        <div>
          <label className="block text-gray-700 mb-1">
            {t('firstName')}<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) =>
              setFormData({ ...formData, first_name: e.target.value })
            }
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
            required
          />
        </div>
     
      <div>
        <label className="block text-gray-700 mb-1">
          {t('middleName')}<span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.middle_name}
          onChange={(e) =>
            setFormData({ ...formData, middle_name: e.target.value })
          }
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-1">
          {t('lastName')}<span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.last_name}
          onChange={(e) =>
            setFormData({ ...formData, last_name: e.target.value })
          }
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 mb-1">
          {t('emailLabel')}<span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 mb-1">
          {t('passwordLabel')}<span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={handlePasswordChange}
          className={`w-full p-2 border rounded focus:outline-none focus:border-primary ${
            formData.password && !passwordStrength.isStrong
              ? "border-red-500"
              : "border-gray-300"
          }`}
          required
          minLength={8}
        />
        {formData.password && (
          <p
            className={`text-sm mt-1 ${
              passwordStrength.isStrong ? "text-green-500" : "text-red-500"
            }`}
          >
            {passwordStrength.isStrong
              ? t('strongPassword')
              : passwordStrength.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-gray-700 mb-1">
          {t('dateOfBirth')}<span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.birth_date}
          onChange={(e) => {
            const value = e.target.value;
            setFormData({ ...formData, birth_date: value });
            validateBirthDate(value);
          }}
          className={`w-full p-2 border rounded focus:outline-none focus:border-primary ${
            birthDateError ? "border-red-500" : "border-gray-300"
          }`}
          max={getMaxBirthDate()}
          min="1900-01-01"
          required
        />
        {birthDateError && (
          <p className="text-sm text-red-500 mt-1">{birthDateError}</p>
        )}
      </div>

      <div>
        <label className="block text-gray-700 mb-1">
          {t('genderLabel')}<span className="text-red-500">*</span>
        </label>
        <select
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
          required
        >
          <option value="">{t('selectGender')}</option>
          <option value="Male">{t('male')}</option>
          <option value="Female">{t('female')}</option>
        </select>
      </div>

      <div>
        <label className="block text-gray-700 mb-1">
          {t('roleLabel')}<span className="text-red-500">*</span>
        </label>
        <select
          value={formData.role_id}
          onChange={(e) =>
            setFormData({ ...formData, role_id: e.target.value })
          }
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
          required
          disabled={rolesLoading}
        >
          <option value="">{t('selectRole')}</option>
          {rolesResponse?.data?.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name} - {role.description}
            </option>
          ))}
        </select>
        {rolesLoading && (
          <p className="text-sm text-gray-500">{t('loadingRoles')}</p>
        )}
      </div>

      <div>
        <label className="block text-gray-700 mb-1">
          {t('phoneNumber')}<span className="text-red-500">*</span>
        </label>
        <div className="flex">
          <select
            className="p-2 border border-gray-300 mr-2 rounded-l focus:outline-none focus:border-primary"
            value={selectedCountryCode}
            onChange={(e) => setSelectedCountryCode(e.target.value)}
          >
            {countryCodes.map((country) => (
              <option
                key={country.code}
                value={country.dial_code}
                style={{
                  background: "white",
                  border: "1px solid #D1D5DB",
                  color: "black",
                }}
              >
                {country.flag} {country.dial_code}
              </option>
            ))}
          </select>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={(e) => {
              const input = e.target.value;
              const formattedInput = input.replace(/[^0-9\s-()]/g, "");
              setFormData((prev) => ({
                ...prev,
                phone: formattedInput,
              }));
            }}
            className="w-full p-2 border border-gray-300 rounded-r focus:outline-none focus:border-primary"
            placeholder="e.g., 123-456-7890"
            required
          />
        </div>
      </div>

      {!hideLanguageAndDialect && (
        <>
          <div>
            <label className="block text-gray-700 mb-2">{t('languageLabel')}</label>
            <select
              name="language_id"
              value={formData.language_id}
              onChange={handleLanguageChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary"
              disabled={languageLoading || !languageResponseData?.data.length}
            >
              <option value="">{t('selectLanguageOption')}</option>
              {languageResponseData?.data.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.name}
                </option>
              ))}
            </select>
          </div>
          {formData.language_id && (
            <div>
              <label className="block text-gray-700 mb-2">{t('dialectLabel')}</label>
              <select
                name="dialect_id"
                value={formData.dialect_id}
                onChange={handleDialectChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary"
                disabled={dialectsLoading || !dialectResponseData?.data.length}
              >
                <option value="">{t('selectDialect')}</option>
                {dialectResponseData?.data.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" type="button" onClick={oncloseAction}>
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          disabled={
            addUserMutation.isPending ||
            rolesLoading ||
            !passwordStrength.isStrong
          }
        >
          {addUserMutation.isPending ? t('creating') : t('createUser')}
        </Button>
      </div>
    </form>
  );
}
