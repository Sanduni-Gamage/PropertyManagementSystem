using AutoMapper;
using RentalWise.Application.DTOs.Landlord;

using RentalWise.Application.DTOs.Property;
using RentalWise.Application.DTOs.Tenant;

using RentalWise.Domain.Entities;

using RentalWise.Domain.Interfaces;


namespace RentalWise.Application.Mappings
{

    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Property, PropertyDto>()
            .ForMember(dest => dest.Suburb, opt => opt.MapFrom(src => src.Suburb))
            .ForMember(dest => dest.Media, opt => opt.MapFrom(src => src.Media));
          

            CreateMap<PropertyMedia, PropertyMediaDto>();

            CreateMap<CreatePropertyDto, Property>()
                .ForMember(dest => dest.Media, opt => opt.Ignore()); // Media handled separately after upload
            CreateMap<UpdatePropertyDto, Property>()
                .ForMember(dest => dest.Media, opt => opt.Ignore()); // Media handled separately after upload

            CreateMap<PropertySearchDto, PropertySearchFilter>();

            // Suburb -> SuburbDto
            CreateMap<Suburb, SuburbDto>()
                .ForMember(dest => dest.District, opt => opt.MapFrom(src => src.District));

            // District -> DistrictDto
            CreateMap<District, DistrictDto>()
                .ForMember(dest => dest.Region, opt => opt.MapFrom(src => src.Region));

            // Region -> RegionDto
            CreateMap<Region, RegionDto>();

            //tenant
            CreateMap<CreateTenantDto, Tenant>();
            CreateMap<Tenant, TenantDto>();
            CreateMap<UpdateTenantDto, Tenant>()
             .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
            // The above condition ignores nulls during update, useful for PATCH-like behavior

            // CreateLandlordDto -> Landlord
            CreateMap<CreateLandlordDto, Landlord>();
                  
            CreateMap<Landlord, LandlordDto>();
            CreateMap<UpdateLandlordDto, Landlord>()
              .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
            // The above condition ignores nulls during update, useful for PATCH-like behavior

           
        }
    }
}
