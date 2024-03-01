class Apifeatures {
  constructor(query, querystr) {
    this.query = query;
    this.querystr = querystr;
  }

  filter() {
    let queryObj = { ...this.querystr };
    // If we want to exclude any query field ==>
    const excludeFields = ["sort", "page", "limit", "fields"];
    excludeFields.forEach((el) => {
      delete queryObj[el];
    });
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );
    queryObj = JSON.parse(queryString);
    this.query = this.query.find(queryObj);
    return queryObj;
  }
  sort() {
    if (this.querystr.sort) {
      const sortBy = this.querystr.sort.split(",").join(" ");
      // console.log(sortBy);
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    // console.log(this);
    return this;
  }
  limitFields() {
    if (this.querystr.fields) {
      const fields = this.querystr.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    // console.log(this);
    return this;
  }
  paginate() {
    const page = this.querystr.page * 1 || 1;
    const limit = this.querystr.limit * 1 || 10;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    // if (req.query.page) {
    //   const movieCount = await Movie.countDocuments();
    //   if (skip >= movieCount) {
    //     throw new Error("Page is not found");
    //   }
    // }
    return this;
  }
}

module.exports = Apifeatures;
