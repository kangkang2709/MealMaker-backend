class Blog {
    constructor({
        _id = null,
        user_id,
        title,
        recipe, // object Recipe trực tiếp
        reject_reason = [],
        created_at = new Date(),
    }) {
        this._id = _id;
        this.user_id = user_id;
        this.title = title;
        this.recipe = recipe;

        this.rating = 0; // positive votes
        this.bad_rating = 0; // negative votes

        // difficulty_score_distribution: votes từ rating positive, tổng = rating
        this.difficulty_score_distribution = {};
        for (let i = 1; i <= 5; i++) this.difficulty_score_distribution[i] = 0;

        this.diff_score = 0; // trung bình từ distribution
        this.reject_reason = reject_reason;
        this.created_at = created_at;
    }

    // Thêm 1 lượt rating positive với điểm difficulty score
    incrementRating(score = 3) {
        if (score < 1 || score > 5) throw new Error("Difficulty score must be 1-5");
        this.rating += 1;
        this.difficulty_score_distribution[score] += 1;
        this.calculateDiffScore();
    }

    // Thêm 1 lượt rating negative, không ảnh hưởng diff_score
    incrementBadRating() {
        this.bad_rating += 1;
    }

    // Tính diff_score trung bình từ difficulty_score_distribution
    calculateDiffScore() {
        const totalVotes = Object.values(this.difficulty_score_distribution).reduce((a, b) => a + b, 0);
        if (totalVotes === 0) {
            this.diff_score = 0;
            return this.diff_score;
        }
        let totalScore = 0;
        for (let i = 1; i <= 5; i++) {
            totalScore += i * this.difficulty_score_distribution[i];
        }
        this.diff_score = totalScore / totalVotes;
        return this.diff_score;
    }

    // Xác định có public công thức hay không
    evaluatePublicStatus() {

    }
}

module.exports = Blog;
