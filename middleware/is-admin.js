module.exports = (req, res, next) => {
    if (req.session.staff.isAdmin == false) {
        return res.redirect('/');
    }
    next();
}