const multer = require('multer')
const sharp = require('sharp')
const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')
// const User = require('./userModel')

// Save image in memory because we need to resize it first anyway before saving to the disk
const multerStorage = multer.memoryStorage();

// Test if passed in object is an image. This test can be for any file (ex. could be testing if a CSV file is being uploaded)
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false)
    }
}

const tourSchema = new mongoose.Schema({
    //name: String
    //Can also put use more options within a field, like we did with this "name" string
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxLength: [40, 'A tour name must have 40 or less characters'],
        minLength: [10, 'A tour name must have 10 or more characters'],
        // validate: [validator.isAlpha, 'Tour name must only be characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        // Only works for strings (not numbers)
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium or difficult'
        }
    },
    // Ratings aren't "required" because the user isn't giving these, it's calculated by the server
    ratingsAverage: {
        type: Number,
        default: 4.5,
        // These work for dates too (not just numbers)
        min: [1, 'Rating must be above or equal to 1.0'],
        max: [5, 'Rating must be below or equal to 5.0'],
        set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val) {
                // this only points to current doc on NEW document creation
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below regular price'
        },
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a description']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        // Mongoose automatically translates this to a readable date
        default: Date.now(),
        // Ignores it in all queries (but still shows up in database)
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        // GeoJSON (has specific criteria below. everything through description)
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        // [Longitude, Latitude]
        coordinates: [Number],
        address: String,
        description: String
    }, 
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
});

// Set common query keys as indexes for faster lookups. 1 is ascending, -1 is descending (usually asc vs dsc not that important though)
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' })

tourSchema.virtual('durationWeeks').get(function() {
    return this.duration / 7;
});

// Virtual populate. Remember that this is not enough to show in queries. We have to also .populate()
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create() (but not before .insertMany)
tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// Embedding implementation
// I tried using this and learned that this only works on .save() and .create(). So if the guides array can be updated, then we
// either have to go to manually do updates that end in .save() instead of .findByIdAndUpdate(). Otherwise, you can do normal
// referencing instead.
// Another note: this method is for directly replacing our guide ids with their objects in the database. we can still just
// access them by keeping their ids if that's all our application needs
// tourSchema.pre('save', async function(next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });

// tourSchema.pre('save', function(next) {
//     console.log('will save document');
//     next();
// })

// // Post middleware functions run after all Pre middleware functions have completed
// tourSchema.post('save', function(doc, next) {
//     console.log(doc);
//     next();
// });

// QUERY MIDDLEWARE
// tourSchema.pre('find', function(next) {
// ^find is a regular expression that means: do for all expressions that start with "find"
tourSchema.pre(/^find/, function(next) {
    this.find({ secretTour: { $ne: true } });

    this.start = Date.now();
    next();
});

tourSchema.post(/^find/, function(docs, next) {
    console.log(`Query took: ${Date.now() - this.start} ms`);
    next();
});

tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'guides',
        // Can add additional selectors to what is being populated from guides. populate() can also just have the path directly given
        // as the only argument, like .populate('guides');
        select: '-__v -passwordChangedAt'
    })

    next();
})

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//     console.log(this.pipeline());
//     next();
// })

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
