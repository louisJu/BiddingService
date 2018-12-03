'use strict';

var NS = 'kr.co.daou.biddingservice';
/**
 * Close the bidding for product listing and choose the
 * highest bid that is over the asking price
 * @param {kr.co.daou.biddingservice.CloseBidding} closeBidding - the closeBidding transaction
 * @transaction
 */
function closeBidding(closeBidding) {
  var listing = closeBidding.listing;
  if(listing.state !== 'FOR_SALE') {
    throw new Error('Listing is not FOR SALE');
  }
  // by default we mark the listing as RESERVE_NOT_MET
  listing.state = 'RESERVE_NOT_MET';
  var oldOwner = listing.product.owner.email;
  var highestOffer = null;
  var buyer = null;
  var seller = listing.product.owner;
  if(listing.offers && listing.offers.length > 0) {
    // sort the bids by bidPrice
    listing.offers.sort(function(a, b) {
      return(b.bidPrice - a.bidPrice);
    });
    highestOffer = listing.offers[0];
    if(highestOffer.bidPrice >= listing.reservePrice) {
      buyer = highestOffer.member;
      //seller = listing.owner;
      // update the balance of the seller
      seller.balance += highestOffer.bidPrice;
      // update the balance of the buyer
      buyer.balance -= highestOffer.bidPrice;
      // transfer the product to the buyer
      listing.product.owner = buyer;
      // Clear the offers
      //listing.offers = null;
      // mark the listing as SOLD
      listing.state = 'SOLD';
    }
  }
  listing.product.owner.products.push(listing.product);
  return getParticipantRegistry(NS + '.Seller').then(function(sellerRegistry) {
    // update seller
    return sellerRegistry.update(seller);
  }).then(function() {
    if(listing.state === 'SOLD') {
      return getParticipantRegistry(NS + '.Member').then(function(memberRegistry) {
        return memberRegistry.update(buyer);
      });
    }
  }).then(function() {
    return getAssetRegistry(NS + '.Product');
  }).then(function(productRegistry) {
    // remove the listing
    return productRegistry.update(listing.product);
  }).then(function() {
    return getAssetRegistry(NS + '.ProductListing');
  }).then(function(productListingRegistry) {
    // remove the listing
    return productListingRegistry.update(listing);
  });
}
/**
 * Make an Offer for a ProductListing
 * @param {kr.co.daou.biddingservice.Offer} offer - the offer
 * @transaction
 */
function makeOffer(offer) {
  var listing = offer.listing;
  if(listing.state !== 'FOR_SALE') {
    throw new Error('Listing is not FOR SALE');
  }
  if(offer.bidPrice < listing.reservePrice) {
    throw new Error('Bid amount less than reserve amount!!');
  }
  if(offer.member.balance < offer.bidPrice) {
    throw new Error('Insufficient fund for bid. Please verify the placed bid!!');
  }
  return getAssetRegistry(NS + '.ProductListing').then(function(productListingRegistry) {
    // save the product listing
    listing.offers.push(offer);
    return productListingRegistry.update(listing);
  });
}
/**
 * Create a new listing
 * @param {kr.co.daou.biddingservice.StartBidding} publishListing - the listing transaction
 * @transaction
 */
function publishListing(listing) {
  listing.product.owner.products = listing.product.owner.products.filter(function(object) {
    return object.getIdentifier() !== listing.product.getIdentifier();
  });
  var productListing = null;
  var factory = getFactory();
  return getAssetRegistry(NS + '.ProductListing').then(function(registry) {
    // Create the bond asset.
    productListing = factory.newResource(NS, 'ProductListing', listing.listingId);
    productListing.reservePrice = listing.reservePrice;
    productListing.state = 'FOR_SALE';
    productListing.product = listing.product;
    productListing.offers = [];
    // Add the bond asset to the registry.
    return registry.add(productListing);
  }).then(function() {
    return getParticipantRegistry(NS + '.Seller');
  }).then(function(sellerRegistry) {
    // save the buyer
    return sellerRegistry.update(listing.product.owner);
  });
}
/**
 * Add new Product
 * @param {kr.co.daou.biddingservice.AddProduct} addProduct - new product addition
 * @transaction
 */
function addProduct(newproduct) {
  var product = getFactory().newResource(NS, 'Product', newproduct.productId);
  product.description = newproduct.description;
  product.owner = newproduct.owner;
  if(!product.owner.products) {
    product.owner.products = [];
  }
  product.owner.products.push(product);
  return getAssetRegistry(NS + '.Product').then(function(registry) {
    return registry.add(product);
  }).then(function() {
    return getParticipantRegistry(NS + '.Seller');
  }).then(function(sellerRegistry) {
    return sellerRegistry.update(newproduct.owner);
  });
}
