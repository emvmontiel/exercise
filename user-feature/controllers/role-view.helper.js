const buildRoleViewData = ({ user, assignments, reports }) => {
  const roleName = assignments?.[0]?.idroles?.name || 'Guest';
  const currentUserId = user?._id?.toString?.() || user?.id || user;
  const isSystemAdmin = roleName === 'System Administrator';

  const userReports = reports.filter((report) => {
    const reportUserId = report.userId?.toString?.() || report.userId;
    return reportUserId === currentUserId;
  });

  return {
    userid: currentUserId,
    role: roleName,
    report: isSystemAdmin ? reports : userReports,
  };
};

module.exports = { buildRoleViewData };
