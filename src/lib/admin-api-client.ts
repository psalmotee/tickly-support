import { toast } from "react-toastify";

export function handleAdminApiAuthRedirect(response: Response): boolean {
  if (response.status === 401) {
    toast.error("Your session has expired. Please log in again.");
    window.location.href = "/login";
    return true;
  }

  if (response.status === 403) {
    toast.error("Admin access is required for this action.");
    window.location.href = "/user-dashboard";
    return true;
  }

  return false;
}
