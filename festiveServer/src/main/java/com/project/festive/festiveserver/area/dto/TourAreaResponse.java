package com.project.festive.festiveserver.area.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class TourAreaResponse {
    private Response response;
    
    @Data
    public static class Response {
        private Header header;
        private Body body;
    }
    
    @Data
    public static class Header {
        private String resultCode;
        private String resultMsg;
    }
    
    @Data
    public static class Body {
        private Items items;
        private int numOfRows;
        private int pageNo;
        private int totalCount;
    }
    
    @Data
    public static class Items {
        private List<Item> item;
    }
    
    @Data
    public static class Item {
        @JsonProperty("rnum")
        private String rnum;
        
        @JsonProperty("code")
        private String code;
        
        @JsonProperty("name")
        private String name;
    }
} 