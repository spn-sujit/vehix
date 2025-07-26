"use client";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import useFetch from "../../../../hooks/use-fetch";
import { getCars } from "../../../../actions/car-listing";
import CarListingsLoading from "../../../(admin)/admin/cars/_components/car-listings-loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import Link from "next/link";
import CarCard from "../../../../components/car-card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
const CarListings = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 6;
  const search = searchParams.get("search") || "";
  const make = searchParams.get("make") || "";
  const bodyType = searchParams.get("bodyType") || "";
  const fuelType = searchParams.get("fuelType") || "";
  const color = searchParams.get("color") || "";
  const transmission = searchParams.get("transmission") || "";
  const minPrice = searchParams.get("minPrice") || 0;
  const maxPrice = searchParams.get("maxPrice") || Number.MAX_SAFE_INTEGER;
  const sortBy = searchParams.get("sortBy") || "newest";
  const page = parseInt(searchParams.get("page") || "1");

  const { loading, fn: fetchCars, data: result, error } = useFetch(getCars);

  useEffect(() => {
    fetchCars({
      search,
      make,
      bodyType,
      fuelType,
      transmission,
      color,
      minPrice,
      maxPrice,
      sortBy,
      page,
      limit,
    });
  }, [
    search,
    make,
    bodyType,
    fuelType,
    color,
    transmission,
    minPrice,
    maxPrice,
    sortBy,
    page,
    limit
  ]);

 

  const handlePageChange = (pageNum) => {
    const params = new URLSearchParams(searchParams);
    params.set('page',pageNum.toString());
    router.push(`?${params.toString()}`);

    
  };

  const getPaginationUrl = (pageNum) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNum.toString());
    return `?${params.toString()}`;
  };

  if (loading && !result) {
    return <CarListingsLoading />;
  }
  if (!result || !result.data) {
    return null;
  }
  if (error || (!result && !result.success)) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load cars. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const { data: cars, pagination } = result;

  if (cars.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-gray-50">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <Info className="h-8 w-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-medium mb-2">No cars found</h3>
        <p className="text-gray-500 mb-6 max-w-md">
          We couldn't find any cars matching your search criteria. Try adjusting
          your filters or search term.
        </p>
        <Button variant="outline" asChild>
          <Link href="/cars">Clear all filters</Link>
        </Button>
      </div>
    );
  }

  const paginationItems = [];
  const visiblePageNumbers = [];
  visiblePageNumbers.push(1);
  for (
    let i = Math.max(2, page - 1);
    i <= Math.min(pagination.pages - 1, page + 1);
    i++
  ) {
    visiblePageNumbers.push(i);
  }
  if(pagination.pages>1){
    visiblePageNumbers.push(pagination.pages);
  }
   // Sort and deduplicate
  const uniquePageNumbers = [...new Set(visiblePageNumbers)].sort(
    (a, b) => a - b
  );

    // Create pagination items with ellipses
    let lastPageNumber = 0;
    uniquePageNumbers.forEach((pageNumber)=>{
      if(pageNumber-lastPageNumber>1){
          paginationItems.push(
            <PaginationItem key={`ellipses-${pageNumber}`}>
              <PaginationEllipsis/>
            </PaginationItem>
          )
      };

       paginationItems.push(
        <PaginationItem key={pageNumber}>
            <PaginationLink href={getPaginationUrl(pageNumber)} isActive={pageNumber===page} onClick={(e)=>{e.preventDefault();handlePageChange(pageNumber)}} >{pageNumber}</PaginationLink>
        </PaginationItem>
       );
       lastPageNumber=pageNumber;
    });
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          Showing{" "}
          <span className="font-medium">
            {(page - 1) * limit + 1} -{" "}
            {Math.min(page * limit, pagination.total)}
          </span>{" "}
          of <span className="font-medium">{pagination.total} </span>
          Cars
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cars.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </div>

      {pagination.pages > 1 && (
        <Pagination className="mt-10">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(e)=>{e.preventDefault(); if(page>1) handlePageChange(page-1)}}
                href={getPaginationUrl(page-1)}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

          {paginationItems.map((item)=>item)}
            <PaginationItem>
              <PaginationNext href={getPaginationUrl(page+1)} onClick={(e)=>{e.preventDefault();if(page<pagination.pages){
                handlePageChange(page+1)
              }}}  className={page>=pagination.pages?'pointer-events-none opacity-50':''}/>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default CarListings;
