const permissionMiddleware = (roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }

    next();
  };
};

export default permissionMiddleware;
