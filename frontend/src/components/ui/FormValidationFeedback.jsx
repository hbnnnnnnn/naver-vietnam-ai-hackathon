import React from "react";
import Icon from "../AppIcon";

const FormValidationFeedback = ({
  type = "error", // 'error', 'success', 'warning', 'info'
  message,
  show = false,
  className = "",
}) => {
  if (!show || !message) return null;

  const getIconAndStyles = () => {
    switch (type) {
      case "success":
        return {
          icon: "CheckCircle",
          bgColor: "bg-success/10",
          borderColor: "border-success/20",
          textColor: "text-success",
          iconColor: "text-success",
        };
      case "warning":
        return {
          icon: "AlertTriangle",
          bgColor: "bg-warning/10",
          borderColor: "border-warning/20",
          textColor: "text-warning-foreground",
          iconColor: "text-warning",
        };
      case "info":
        return {
          icon: "Info",
          bgColor: "bg-secondary/10",
          borderColor: "border-secondary/20",
          textColor: "text-secondary-foreground",
          iconColor: "text-secondary",
        };
      case "error":
      default:
        return {
          icon: "AlertCircle",
          bgColor: "bg-error/10",
          borderColor: "border-error/20",
          textColor: "text-error",
          iconColor: "text-error",
        };
    }
  };

  const { icon, bgColor, borderColor, textColor, iconColor } =
    getIconAndStyles();

  return (
    <div
      className={`
        flex items-start gap-2 p-3 rounded-lg border backdrop-blur-sm
        ${bgColor} ${borderColor}
        animate-slide-up
        ${className}
      `}
    >
      <Icon
        name={icon}
        size={16}
        className={`mt-0.5 flex-shrink-0 ${iconColor}`}
      />
      <p className={`text-sm caption ${textColor} leading-relaxed`}>
        {message}
      </p>
    </div>
  );
};

// Field-level validation feedback component
const FieldValidationFeedback = ({
  error,
  success,
  warning,
  info,
  className = "",
}) => {
  if (error) {
    return (
      <FormValidationFeedback
        type="error"
        message={error}
        show={true}
        className={`mt-1 ${className}`}
      />
    );
  }

  if (success) {
    return (
      <FormValidationFeedback
        type="success"
        message={success}
        show={true}
        className={`mt-1 ${className}`}
      />
    );
  }

  if (warning) {
    return (
      <FormValidationFeedback
        type="warning"
        message={warning}
        show={true}
        className={`mt-1 ${className}`}
      />
    );
  }

  if (info) {
    return (
      <FormValidationFeedback
        type="info"
        message={info}
        show={true}
        className={`mt-1 ${className}`}
      />
    );
  }

  return null;
};

// Real-time validation indicator
const ValidationIndicator = ({
  isValid,
  isValidating = false,
  className = "",
}) => {
  if (isValidating) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isValid === true) {
    return (
      <Icon
        name="CheckCircle"
        size={16}
        className={`text-success ${className}`}
      />
    );
  }

  if (isValid === false) {
    return (
      <Icon name="XCircle" size={16} className={`text-error ${className}`} />
    );
  }

  return null;
};

export default FormValidationFeedback;
export { FieldValidationFeedback, ValidationIndicator };
