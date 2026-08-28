"use client";
import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";

// ⚠️ Replace with your actual Tigrinya UUID (get it from the DB)
const TIGRINYA_LANGUAGE_ID = "92e676cb-517f-4c4a-9546-5d586fc14d92";

const submitRegistration = async ({ invitationLinkId, data }: { invitationLinkId: string; data: any }) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/project-mgmt/invitation-link/accept-invite/${invitationLinkId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to register");
  }
  return response.json();
};

const LinkFormPage: React.FC = () => {
  const router = useRouter();
  const { invitation_link_id } = useParams();
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    gender: "",
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: submitRegistration,
    onSuccess: () => {
      toast.success("Registration successful!");
      router.push("/login");
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password" || name === "confirmPassword") setError(null);
  };

  const validateForm = () => {
    if (!formData.first_name || formData.first_name.trim().length < 3) {
      setError("First name must be at least 3 characters");
      return false;
    }
    if (!formData.last_name || formData.last_name.trim().length < 3) {
      setError("Last name must be at least 3 characters");
      return false;
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!formData.password || !pwRegex.test(formData.password)) {
      setError("Password must be 8+ chars with uppercase, lowercase, number, and special char (!@#$%^&*)");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!formData.age || parseInt(formData.age) < 10 || parseInt(formData.age) > 100) {
      setError("Please enter a valid age (10–100)");
      return false;
    }
    if (!formData.gender) {
      setError("Please select a gender");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Calculate birth_date from age (YYYY-MM-DD)
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - parseInt(formData.age));
    birthDate.setMonth(0);
    birthDate.setDate(1);
    const birthDateString = birthDate.toISOString().split('T')[0];

    // Auto-fill middle_name with "N/A" if empty (satisfies 3-char minimum)
    const middleName = formData.middle_name.trim().length >= 3
      ? formData.middle_name.trim()
      : "N/A";

    const payload = {
      first_name: formData.first_name.trim(),
      middle_name: middleName,
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      birth_date: birthDateString,
      gender: formData.gender,
      language_id: TIGRINYA_LANGUAGE_ID,
    };

    mutation.mutate({ invitationLinkId: invitation_link_id as string, data: payload });
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:block w-2/5 relative">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/logo/backgroundimage.png"
            alt="Leyu"
            fill
            priority
            className="object-cover"
            quality={100}
            sizes="(max-width: 768px) 100vw, 40vw"
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8 text-white">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">Welcome to Leyu</h1>
            <p className="text-lg">Welcome to Leyu</p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-gray-100 p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Image src="/logo/leyu.png" width={206} height={62} alt="Leyu Logo" />
            <h2 className="text-2xl font-bold mt-4">Create Your Account</h2>
            <p className="text-sm text-gray-600">Contribute to the Leyu Platform</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name (or nickname)</label>
                <Input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full h-10"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name (optional)</label>
                <Input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
                  className="w-full h-10"
                  placeholder="Leave blank if none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name (or family name)</label>
              <Input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full h-10"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full h-10"
                required
              />
            </div>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full h-10"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full h-10"
                  required
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <Input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full h-10"
                  min="10"
                  max="100"
                  placeholder="e.g., 25"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">We only store your age range, not exact date.</p>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full h-10 border border-gray-300 rounded bg-white"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            <Button
              type="submit"
              className="w-full h-12 bg-primary text-white py-2 rounded"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Registering..." : "Register & Start Recording"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LinkFormPage;
