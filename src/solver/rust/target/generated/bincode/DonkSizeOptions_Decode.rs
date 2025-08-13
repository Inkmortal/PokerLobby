impl :: bincode :: Decode for DonkSizeOptions
{
    fn decode < __D : :: bincode :: de :: Decoder > (decoder : & mut __D)
    ->core :: result :: Result < Self, :: bincode :: error :: DecodeError >
    { Ok(Self { donk : :: bincode :: Decode :: decode(decoder) ?, }) }
} impl < '__de > :: bincode :: BorrowDecode < '__de > for DonkSizeOptions
{
    fn borrow_decode < __D : :: bincode :: de :: BorrowDecoder < '__de > >
    (decoder : & mut __D) ->core :: result :: Result < Self, :: bincode ::
    error :: DecodeError >
    {
        Ok(Self
        { donk : :: bincode :: BorrowDecode :: borrow_decode(decoder) ?, })
    }
}