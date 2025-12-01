import React, { useEffect, useState } from "react";
import ApiService from "../../../services/api";
import Icon from "../../../components/AppIcon";
import Image from "../../../components/AppImage";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";

const ProfileHeader = ({ userProfile, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(userProfile);

  const handleEdit = () => {
    setEditedProfile({
      ...userProfile,
      concerns: Array.isArray(userProfile?.concerns)
        ? userProfile.concerns
        : [],
    });
    setIsEditing(true);
  };

  const defaultAvatar = "https://aic.com.vn/avatar-fb-mac-dinh/";

  const skinTypeOptions = [
    { value: "oily", label: "Oily" },
    { value: "dry", label: "Dry" },
    { value: "combination", label: "Combination" },
    { value: "sensitive", label: "Sensitive" },
    { value: "normal", label: "Normal" },
  ];

  const skinStatusOptions = [
    { value: "acne", label: "Acne" },
    { value: "aging", label: "Aging" },
    { value: "pigmentation", label: "Hyperpigmentation" },
    { value: "sensitivity", label: "Sensitivity" },
    { value: "dryness", label: "Dryness" },
    { value: "oiliness", label: "Oiliness" },
  ];

  const handleSave = async () => {
    try {
      const payload = {
        username: userProfile?.username,
        name: editedProfile?.name,
        skinType: editedProfile?.skinType,
        concerns: Array.isArray(editedProfile?.concerns)
          ? editedProfile.concerns
          : [],
        avatar: editedProfile?.avatar || userProfile?.avatar,
      };
      await ApiService.createOrUpdateUser(payload);
      const updatedUser = await ApiService.getUserByUsername(payload.username);
      onUpdateProfile({
        username: updatedUser.user.username,
        name: updatedUser.user.name,
        avatar: updatedUser.user.avatar || userProfile?.avatar,
        skinType: updatedUser.user.skinType,
        concerns: updatedUser.user.concerns,
        joinDate: updatedUser.user.createdAt,
      });
      setIsEditing(false);
    } catch (error) {
      alert("Save profile failed! " + (error?.message || ""));
    }
  };

  const handleCancel = () => {
    setEditedProfile(userProfile);
    setIsEditing(false);
  };

  // Keep edit form in sync with latest profile data
  useEffect(() => {
    setEditedProfile(userProfile);
  }, [userProfile]);

  return (
    <div
      className="glass-card p-4 sm:p-6 mb-6 rounded-2xl"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(255,144,187,0.15) 0%, rgba(138,204,213,0.15) 100%)",
        marginTop: "-70px",
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        {/* Profile Avatar */}
        <div className="relative flex justify-center sm:block w-full sm:w-auto mb-4 sm:mb-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white/20 shadow-glass mx-auto sm:mx-0">
            <Image
              src={userProfile?.avatar || defaultAvatar}
              alt={userProfile?.avatarAlt || "Default Avatar"}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Profile Information */}
        <div className="flex-1 w-full sm:w-auto">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full name"
                  value={editedProfile?.name}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      name: e?.target?.value,
                    })
                  }
                  placeholder="Enter full name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Skin type"
                  options={skinTypeOptions}
                  value={editedProfile?.skinType}
                  onChange={(value) =>
                    setEditedProfile({ ...editedProfile, skinType: value })
                  }
                />
                <Select
                  label="Skin Status"
                  options={skinStatusOptions}
                  value={editedProfile?.concerns}
                  onChange={(value) =>
                    setEditedProfile({
                      ...editedProfile,
                      concerns: value,
                    })
                  }
                  multiple
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="default"
                  onClick={handleSave}
                  iconName="Check"
                  iconPosition="left"
                  className="rounded-3xl"
                >
                  Save changes
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  iconName="X"
                  iconPosition="left"
                  className="rounded-3xl hover:bg-[rgba(255,144,187,0.2)]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-heading font-bold text-foreground mb-1">
                  {userProfile?.name}
                </h1>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  iconName="Edit2"
                  iconPosition="left"
                  className="rounded-3xl hover:bg-[rgba(255,144,187,0.2)]"
                >
                  Edit
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/40 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Droplets" size={18} className="text-primary" />
                    <span className="font-caption font-medium text-foreground">
                      Skin type
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">
                    {
                      skinTypeOptions?.find(
                        (opt) => opt?.value === userProfile?.skinType
                      )?.label
                    }
                  </p>
                </div>

                <div className="bg-white/40 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Target" size={18} className="text-secondary" />
                    <span className="font-caption font-medium text-foreground">
                      Status
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {Array.isArray(userProfile?.concerns)
                      ? userProfile.concerns
                          .map(
                            (status) =>
                              skinStatusOptions?.find(
                                (opt) => opt?.value === status
                              )?.label || status
                          )
                          .join(", ")
                      : skinStatusOptions?.find(
                          (opt) => opt?.value === userProfile?.concerns
                        )?.label}
                  </p>
                </div>

                <div className="bg-white/40 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Calendar" size={18} className="text-warning" />
                    <span className="font-caption font-medium text-foreground">
                      Joined
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {userProfile?.joinDate
                      ? new Date(userProfile.joinDate).toLocaleDateString(
                          "vi-VN",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        )
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
