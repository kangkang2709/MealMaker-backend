class Blog {
    constructor({
        _id = null,
        user_id,
        title,
        recipe,
        reject_reason = [],
        created_at = new Date(),
        difficulty_score_distribution = null  // ✅ thêm dòng này
    }) {
        this._id = _id;
        this.user_id = user_id;
        this.title = title;
        this.recipe = recipe;

        this.rating = 0; // positive votes
        this.bad_rating = 0; // negative votes

        this.difficulty_score_distribution = difficulty_score_distribution || {};
        for (let i = 1; i <= 5; i++) {
            if (!(i in this.difficulty_score_distribution)) {
                this.difficulty_score_distribution[i] = 0;
            }
        }

        this.diff_score = 0;
        this.reject_reason = reject_reason;
        this.created_at = created_at;
    }

    // Tăng vote positive với score
    incrementRating(score) {
        if (score === undefined) throw new Error('Score phải được cung cấp khi tăng rating');
        this.addScore(score);
    }

    // Giảm vote positive với score
    decrementRating(score) {
        if (score === undefined) throw new Error('Score phải được cung cấp khi giảm rating');
        this.rating = Math.max(0, this.rating - 1);
        if (this.difficulty_score_distribution[score]) {
            this.difficulty_score_distribution[score] = Math.max(0, this.difficulty_score_distribution[score] - 1);
        }
        this.calculateDiffScore();
    }

    // Tăng vote negative
    incrementBadRating() {
        this.bad_rating += 1;
    }

    // Giảm vote negative
    decrementBadRating() {
        this.bad_rating = Math.max(0, this.bad_rating - 1);
    }

    // Thêm vote positive với score
    addScore(score) {
        if (score < 1 || score > 5) throw new Error('Score phải từ 1 đến 5');
        this.rating += 1;
        this.difficulty_score_distribution[score] = (this.difficulty_score_distribution[score] || 0) + 1;
        this.calculateDiffScore();
    }

    // Undo vote
    undoScore(score = null, isGoodRating = true) {
        if (isGoodRating) {
            if (score === null) throw new Error('Score phải được cung cấp khi undo vote positive');
            this.decrementRating(score);
        } else {
            this.decrementBadRating();
        }
    }

    // Tính diff_score trung bình từ distribution
    calculateDiffScore() {
        const dist = this.difficulty_score_distribution;
        const totalRating = Object.values(dist).reduce((a, b) => a + b, 0);
        this.diff_score = totalRating === 0
            ? 0
            : Object.entries(dist).reduce((sum, [score, count]) => sum + Number(score) * count / totalRating, 0);
    }

    // Kiểm tra xem blog có public không
    evaluatePublicStatus() {
        const totalVotes = this.rating + this.bad_rating;
        // this.is_public = totalVotes > 0 && (this.bad_rating / totalVotes) < 0.5;
    }
}

module.exports = Blog;
