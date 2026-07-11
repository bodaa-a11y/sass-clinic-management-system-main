import { toast } from 'sonner';

export const showSuccessMessage = (message: string, description?: string) => {
  toast.success(message, {
    description: description,
    duration: 3000,
  });
};

export const showErrorMessage = (message: string, description?: string) => {
  toast.error(message, {
    description: description,
    duration: 5000,
  });
};

export const showInfoMessage = (message: string, description?: string) => {
  toast.info(message, {
    description: description,
    duration: 3000,
  });
};

export const showWarningMessage = (message: string, description?: string) => {
  toast.warning(message, {
    description: description,
    duration: 4000,
  });
};

export const showLoadingMessage = (message: string) => {
  return toast.loading(message);
};
