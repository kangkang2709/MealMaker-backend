class User {
    constructor(id, data) {
        this.id = id;
        this.name = data.name;
        this.email = data.email;
        this.createdAt = data.createdAt || new Date();
    }
}

module.exports = User;
