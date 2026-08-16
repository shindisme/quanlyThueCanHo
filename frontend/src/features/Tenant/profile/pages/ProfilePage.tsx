import { useState } from "react";
import PageHeader from "../../../../components/layout/PageHeader";
import Button from "../../../../components/ui/Button";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { ROLE_CONFIG } from "../../../../constants";
import { formatApartmentDisplay } from "../../../../utils/string";
import PasswordChangeForm from "../components/PasswordChangeForm";
import ProfileEditModal from "../components/ProfileEditModal";
import ProfileHeader, { type ProfileTab } from "../components/ProfileHeader";
import ProfileInfoTab from "../components/ProfileInfoTab";
import { useProfile } from "../hooks/useProfile";

export default function ProfilePage() {
  const profile = useProfile();
  const [activeTab, setActiveTab] = useState<ProfileTab>("info");

  if (profile.profileLoading) {
    return (
      <div className="flex min-h-75 flex-col items-center justify-center">
        <LoadingSpinner size={36} />
        <span className="mt-2 text-sm text-gray-400">Đang tải hồ sơ...</span>
      </div>
    );
  }

  if (profile.profileError) {
    return (
      <div className="space-y-4 border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
        <p>Không thể tải đầy đủ thông tin hồ sơ.</p>
        <Button variant="outline" onClick={() => void profile.refetchProfile()}>Thử lại</Button>
      </div>
    );
  }

  const displayName = profile.fullName || profile.email?.split("@")[0] || "Người dùng";
  const roleConfig = ROLE_CONFIG[profile.role || "TENANT"];
  const residenceLabel = profile.apartmentInfo
    ? [
        formatApartmentDisplay(profile.apartmentInfo.room_number, profile.apartmentInfo.floor),
        profile.buildingInfo?.branch_name,
      ].filter(Boolean).join(" - ")
    : undefined;

  return (
    <div className="max-w-5xl space-y-6 p-2 font-sans">
      <PageHeader title="Hồ sơ cá nhân" subtitle="Quản lý thông tin tài khoản và bảo mật của bạn" />

      <ProfileHeader
        displayName={displayName}
        phone={profile.phone}
        role={profile.role}
        residenceLabel={residenceLabel}
        assignmentLabel={profile.staffBuildingInfo?.branch_name}
        canEdit={profile.canEditProfile}
        activeTab={activeTab}
        onEdit={profile.handleOpenEditProfile}
        onTabChange={setActiveTab}
      />

      {activeTab === "info" ? (
        <ProfileInfoTab
          displayName={displayName}
          email={profile.email || ""}
          phone={profile.phone}
          role={profile.role}
          roleLabel={roleConfig.label}
          canEdit={profile.canEditProfile}
          staffBuildingName={profile.staffBuildingInfo?.branch_name}
          staffPosition={profile.currentStaff?.position}
          occupantCount={profile.occupantCount}
          maxOccupants={profile.maxOccupantsLimit}
          hasActiveContract={Boolean(profile.userContract)}
          onEdit={profile.handleOpenEditProfile}
        />
      ) : (
        <PasswordChangeForm
          oldPassword={profile.oldPass}
          newPassword={profile.newPass}
          confirmPassword={profile.confirmPass}
          isSaving={profile.saving}
          onOldPasswordChange={profile.setOldPass}
          onNewPasswordChange={profile.setNewPass}
          onConfirmPasswordChange={profile.setConfirmPass}
          onSubmit={profile.handleChangePassword}
          onCancel={() => setActiveTab("info")}
        />
      )}

      <ProfileEditModal
        isOpen={profile.showEditProfileModal}
        fullName={profile.editFullName}
        phone={profile.editPhone}
        isSaving={profile.profileSaving}
        onFullNameChange={profile.setEditFullName}
        onPhoneChange={profile.setEditPhone}
        onClose={() => profile.setShowEditProfileModal(false)}
        onSave={profile.handleSaveProfile}
      />
    </div>
  );
}
