import { CreateRatingDto } from './create-rating.dto';

/**
 * DTO for updating an employer rating
 * Only the rating owner can update their rating
 * All fields are optional for partial updates
 */
export class UpdateRatingDto {
  ratingOverall?: CreateRatingDto['ratingOverall'];
  ratingInterviewExperience?: CreateRatingDto['ratingInterviewExperience'];
  ratingTransparency?: CreateRatingDto['ratingTransparency'];
  ratingCommunication?: CreateRatingDto['ratingCommunication'];
  ratingOfferAccuracy?: CreateRatingDto['ratingOfferAccuracy'];
  ratingWorkLifeBalance?: CreateRatingDto['ratingWorkLifeBalance'];
  wouldWorkAgain?: CreateRatingDto['wouldWorkAgain'];
  reviewText?: CreateRatingDto['reviewText'];
  reviewTitle?: CreateRatingDto['reviewTitle'];
}
