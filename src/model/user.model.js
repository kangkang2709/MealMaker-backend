class User {
    constructor({ _id, user_name, full_name, email, password, avatar_url = '', fridge = [], weekly_menu = {}, recipes = [], blogs = [] }) {
        this._id = _id;                    // string - unique ID
        this.user_name = user_name;        // string
        this.full_name = full_name;        // string
        this.email = email;                // string
        this.password = password;          // string (hashed)
        this.avatar_url = avatar_url;      // string
        this.fridge = fridge;              // array
        this.weekly_menu = weekly_menu;    // object
        this.blogs = blogs;                // array of blog IDs
        this.created_at = new Date();
        this.updated_at = new Date();
    }
}

module.exports = User;
