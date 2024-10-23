// Middleware to check for cookies
const checkAuth = (req, res, next) => {
    const sessionId = req.cookies.session;

    if (!sessionId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // If cookie exists, proceed to the next middleware/route
    next();
};

module.exports = { checkAuth };
