import React from 'react'

const ProfilePage = ({ profile, t }) => {
  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar-card">
          <div className="profile-avatar-preview">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Profile avatar" />
            ) : (
              <span>{(profile.fullName || 'U').slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div className="profile-avatar-label">
            <strong>{profile.fullName || 'User'}</strong>
            <span>{profile.email || 'No email available'}</span>
          </div>
        </div>

        <div className="profile-details">
          <div className="profile-field">
            <label>{t.fullName}</label>
            <div className="profile-value">{profile.fullName || '-'}</div>
          </div>
          <div className="profile-field">
            <label>{t.guideId}</label>
            <div className="profile-value">{profile.guideId || '-'}</div>
          </div>
          <div className="profile-field">
            <label>{t.email}</label>
            <div className="profile-value">{profile.email || '-'}</div>
          </div>
          <div className="profile-field">
            <label>{t.birthday}</label>
            <div className="profile-value">{profile.birthday || '-'}</div>
          </div>
          <div className="profile-field">
            <label>{t.livingAddress}</label>
            <div className="profile-value">{profile.address || '-'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
